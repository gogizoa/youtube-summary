from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
from openai import OpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from typing import Dict, List, Tuple, Any, Optional
from config.config import settings
from db.VideoRepository import VideoRepository
from model.video import VideoSchema


class VideoService:
    def __init__(self):
        self.video_repository = VideoRepository()
        self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=50,
            length_function=len,
        )
        self.vector_stores = {}
        self.similarity_threshold = 1.5

    def get_embedding(self, text: str) -> List[float]:
        """텍스트의 임베딩을 생성합니다."""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            encoding_format="float"
        )
        return response.data[0].embedding

    def create_vector_store(self, texts: List[str], times: List[float] = None) -> FAISS:
        """텍스트 리스트로부터 FAISS 벡터 저장소를 생성합니다."""
        if times is None:
            times = [0.0] * len(texts)

        class CustomEmbeddings:
            def __init__(self, embed_func):
                self.embed_func = embed_func

            def embed_documents(self, texts: List[str]) -> List[List[float]]:
                return [self.embed_func(text) for text in texts]

            def embed_query(self, text: str) -> List[float]:
                return self.embed_func(text)

        custom_embeddings = CustomEmbeddings(self.get_embedding)
        metadatas = [{"start": time} for time in times]

        vector_store = FAISS.from_texts(
            texts=texts,
            embedding=custom_embeddings,
            metadatas=metadatas
        )
        return vector_store

    async def get_video_info(self, video_id: str) -> Dict[str, Any]:
        """YouTube API를 사용하여 비디오 정보를 가져옵니다."""
        try:
            request = self.youtube.videos().list(
                part="snippet,contentDetails",
                id=video_id
            )
            response = request.execute()

            if not response['items']:
                raise ValueError("Video not found")

            return response['items'][0]
        except Exception as e:
            raise Exception(f"Error fetching video info: {str(e)}")

    async def get_transcript(self, video_id: str, language: str = 'ko') -> Tuple[str, List[float]]:
        """유튜브 동영상의 자막을 가져옵니다."""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=[language])
            processed_transcript = []
            times = []

            for item in transcript_list:
                processed_transcript.append(item['text'])
                times.append(item['start'])

            return ' '.join(processed_transcript), times
        except Exception as e:
            raise Exception(f"Error fetching transcript: {str(e)}")

    def _create_summary_prompt(self, transcript_text: str) -> str:
        """영상 요약을 위한 프롬프트를 생성합니다."""
        return f"""
        영상 내용을 다음 형식으로 요약해주세요:

        각 내용은 반드시 한 줄로 작성하며, 중첩 구조나 하위 목록을 사용하지 않습니다.
        모든 요점은 다음의 정확한 형식을 따릅니다:
        * [이모지] **[주제/키워드]:** [한 줄로 된 설명 내용]

        규칙:
        - 주제/키워드는 명사형으로 끝나기
        - 설명은 마침표로 종료
        - 여러 개의 내용은 하위 목록이 아닌 별도의 한 줄로 작성
        - 복잡한 내용도 하나의 간결한 문장으로 압축
        - 각 항목마다 내용을 가장 잘 표현하는 서로 다른 이모지 사용
        - 이모지는 해당 내용과 의미적으로 연관성이 있어야 함

        영상 내용:
        {transcript_text}
        """

    def _create_qa_prompt(self, context: str, question: str) -> str:
        """QA를 위한 프롬프트를 생성합니다."""
        return f"""
        다음은 영상의 일부 내용입니다:
        {context}

        질문: {question}

        규칙:
        1. 주어진 컨텍스트 내용을 기반으로 답변해주세요.
        2. 컨텍스트의 내용이 질문과 충분히 관련이 없다고 판단되면 "주어진 영상 내용에서는 해당 정보를 찾을 수 없습니다."라고 답변해주세요.
        3. 답변은 명확하고 간결하게 작성해주세요.
        4. 가능한 경우 영상의 내용을 인용해서 답변해주세요.
        5. 확실하지 않은 정보는 추측하지 말고, 영상 내용에 없다고 답변해주세요.
        """

    async def generate_summary(self, video_id: str) -> Dict[str, Any]:
        """영상의 요약을 생성합니다."""
        try:
            video_info = await self.get_video_info(video_id)
            transcript, times = await self.get_transcript(video_id)
            chunks = self.text_splitter.split_text(transcript)

            chunk_times = []
            total_length = len(transcript)
            current_pos = 0

            for chunk in chunks:
                position_ratio = current_pos / total_length
                time_index = min(int(position_ratio * len(times)), len(times) - 1)
                chunk_times.append(times[time_index])
                current_pos += len(chunk)

            vector_store = self.create_vector_store(chunks, chunk_times)
            self.vector_stores[video_id] = vector_store

            prompt = self._create_summary_prompt(transcript)
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes video content."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            return {
                "video_id": video_id,
                "title": video_info['snippet']['title'],
                "summary": response.choices[0].message.content,
                "thumbnail": video_info['snippet']['thumbnails']['high']['url']
            }
        except Exception as e:
            raise Exception(f"Error generating summary: {str(e)}")

    async def chat(self, video_id: str, question: str) -> Dict[str, Any]:
        """영상 내용에 대한 질문에 답변합니다."""
        try:
            if video_id not in self.vector_stores:
                await self.generate_summary(video_id)

            vector_store = self.vector_stores[video_id]
            question_embedding = self.get_embedding(question)

            similar_chunks = vector_store.similarity_search_with_score_by_vector(
                question_embedding,
                k=5
            )

            print("similar_chunks", similar_chunks)

            relevant_chunks = [
                (chunk, score) for chunk, score in similar_chunks
                if score <= self.similarity_threshold
            ]

            if not relevant_chunks:
                return {
                    "question": question,
                    "answer": "주어진 영상 내용에서는 해당 정보를 찾을 수 없습니다.",
                    "sources": []
                }

            context_texts = []
            sources_with_times = []

            for chunk, score in relevant_chunks:
                context_texts.append(chunk.page_content)
                start_time = chunk.metadata.get("start", 0)
                sources_with_times.append({
                    "text": chunk.page_content,
                    "timestamp": start_time,
                    "url": f"https://www.youtube.com/watch?v={video_id}&t={int(start_time)}",
                    "similarity_score": float(score)
                })

            context = "\n\n".join(context_texts)
            prompt = self._create_qa_prompt(context, question)

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system",
                     "content": "You are a helpful assistant that answers questions about video content."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            return {
                "question": question,
                "answer": response.choices[0].message.content,
                "sources": sources_with_times
            }

        except Exception as e:
            raise Exception(f"Error generating answer: {str(e)}")

    async def create_video(self, video: VideoSchema) -> Optional[VideoSchema]:
        """비디오 생성 서비스"""
        temp = await self.video_repository.save(video)
        print("service temp ", temp)
        print("type", type (temp))
        return temp

    def get_video(self, video_id: str) -> Optional[VideoSchema]:
        """비디오 조회 서비스"""
        return self.video_repository.find_by_id(video_id)
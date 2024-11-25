# app/services/video_service.py
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
import google.generativeai as genai
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from config.config import settings


class VideoService:
    def __init__(self):
        self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        self.vector_stores = {}

    def get_embedding(self, text: str) -> list:
        """텍스트의 임베딩을 생성합니다."""
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']

    def create_vector_store(self, texts: list[str]) -> FAISS:
        """텍스트 리스트로부터 FAISS 벡터 저장소를 생성합니다."""
        class CustomEmbeddings:
            def __init__(self, embed_func):
                self.embed_func = embed_func

            def embed_documents(self, texts):
                return [self.embed_func(text) for text in texts]

            def embed_query(self, text):
                return self.embed_func(text)

        custom_embeddings = CustomEmbeddings(self.get_embedding)

        vector_store = FAISS.from_texts(
            texts=texts,
            embedding=custom_embeddings
        )
        return vector_store

    async def get_video_info(self, video_id: str):
        try:
            request = self.youtube.videos().list(
                part="snippet,contentDetails",
                id=video_id
            )
            response = request.execute()

            if not response['items']:
                raise Exception("Video not found")

            return response['items'][0]
        except Exception as e:
            raise Exception(f"Error fetching video info: {str(e)}")

    async def get_transcript(self, video_id: str, language='ko'):
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=[language])
            return ' '.join([item['text'] for item in transcript_list])
        except Exception as e:
            raise Exception(f"Error fetching transcript: {str(e)}")

    def _create_summary_prompt(self, transcript_text: str) -> str:
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
        return f"""
        다음은 영상의 일부 내용입니다:
        {context}

        질문: {question}

        규칙:
        1. 주어진 컨텍스트 내용만을 기반으로 답변해주세요.
        2. 컨텍스트에 없는 내용은 "주어진 영상 내용에서는 해당 정보를 찾을 수 없습니다."라고 답변해주세요.
        3. 답변은 명확하고 간결하게 작성해주세요.
        4. 가능한 경우 영상의 구체적인 내용을 인용해서 답변해주세요.
        """

    async def generate_summary(self, video_id: str):
        try:
            # 1. 비디오 정보 가져오기
            video_info = await self.get_video_info(video_id)

            # 2. 자막 가져오기
            transcript = await self.get_transcript(video_id)

            # 3. 트랜스크립트를 청크로 분할하고 벡터 저장소 생성
            chunks = self.text_splitter.split_text(transcript)
            vector_store = self.create_vector_store(chunks)
            self.vector_stores[video_id] = vector_store

            # 4. 요약 프롬프트 생성
            prompt = self._create_summary_prompt(transcript)

            # 5. Gemini API를 사용하여 요약 생성
            response = self.model.generate_content(prompt)

            # 6. 결과 반환
            return {
                "video_id": video_id,
                "title": video_info['snippet']['title'],
                "summary": response.text,
                "thumbnail": video_info['snippet']['thumbnails']['high']['url']
            }
        except Exception as e:
            raise Exception(f"Error generating summary: {str(e)}")

    async def chat(self, video_id: str, question: str):
        try:
            # 1. Vector store 확인
            if video_id not in self.vector_stores:
                await self.generate_summary(video_id)

            vector_store = self.vector_stores[video_id]

            # 2. 질문에 대한 임베딩 생성
            question_embedding = self.get_embedding(question)

            # 3. 가장 유사한 컨텍스트 검색
            similar_chunks = vector_store.similarity_search_by_vector(question_embedding, k=3)
            context = "\n".join([chunk.page_content for chunk in similar_chunks])

            # 4. QA 프롬프트 생성
            prompt = self._create_qa_prompt(context, question)

            # 5. Gemini를 사용하여 답변 생성
            response = self.model.generate_content(prompt)

            return {
                "question": question,
                "answer": response.text,
                "sources": [chunk.page_content for chunk in similar_chunks]
            }
        except Exception as e:
            raise Exception(f"Error generating answer: {str(e)}")
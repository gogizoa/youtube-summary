import { useState } from "react";

export const ContactTab = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // TODO: 이메일 전송 로직 구현
    alert("문의가 전송되었습니다.");
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-section">
      <form onSubmit={handleContactSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            value={contactForm.name}
            onChange={(e) =>
              setContactForm({ ...contactForm, name: e.target.value })
            }
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={contactForm.email}
            onChange={(e) =>
              setContactForm({ ...contactForm, email: e.target.value })
            }
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject">제목</label>
          <input
            type="text"
            id="subject"
            value={contactForm.subject}
            onChange={(e) =>
              setContactForm({ ...contactForm, subject: e.target.value })
            }
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">내용</label>
          <textarea
            id="message"
            value={contactForm.message}
            onChange={(e) =>
              setContactForm({ ...contactForm, message: e.target.value })
            }
            required
          />
        </div>
        <button type="submit" className="submit-button">
          문의하기
        </button>
      </form>
    </div>
  );
};

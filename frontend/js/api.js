/* ==========================================================================
   API Client for Prawo Jazdy 360 LMS Backend
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes("http") 
  ? `${window.location.origin}/api/v1` 
  : "http://localhost:8000/api/v1";

const API = {
  async fetchCourses(category = "B") {
    try {
      const res = await fetch(`${API_BASE_URL}/courses?category=${category}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return await res.json();
    } catch (err) {
      console.warn("API Error, utilizing local fallback state:", err);
      return null;
    }
  },

  async fetchLesson(lessonId) {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/lesson/${lessonId}`);
      if (!res.ok) throw new Error("Failed to fetch lesson");
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  },

  async updateProgress(lessonId, watchedSeconds, isCompleted) {
    try {
      const res = await fetch(`${API_BASE_URL}/progress/lesson/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watched_seconds: watchedSeconds,
          is_completed: isCompleted
        })
      });
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  },

  async fetchExamQuestions(category = "B", limit = 35) {
    try {
      const res = await fetch(`${API_BASE_URL}/tests/questions?category=${category}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch exam questions");
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  },

  async submitExam(answers, testType = "EXAM") {
    try {
      const res = await fetch(`${API_BASE_URL}/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, test_type: testType })
      });
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  },

  async fetchTrafficSigns(category = null) {
    try {
      const url = category 
        ? `${API_BASE_URL}/signs?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/signs`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch traffic signs");
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  },

  async fetchUserStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/progress/summary`);
      if (!res.ok) throw new Error("Failed to fetch user statistics");
      return await res.json();
    } catch (err) {
      console.warn("API Error:", err);
      return null;
    }
  }
};

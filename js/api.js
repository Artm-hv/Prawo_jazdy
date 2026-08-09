/* ==========================================================================
   Pure Frontend Client for Prawo Jazdy 360 LMS (No Backend Required)
   Uses localStorage & embedded datasets for 100% standalone operation
   ========================================================================== */

const STORAGE_KEYS = {
  PROGRESS: "prawo_jazdy_user_progress",
  ATTEMPTS: "prawo_jazdy_test_attempts"
};

// Helper: load progress map from localStorage
function getLocalProgressMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Helper: save progress map to localStorage
function saveLocalProgressMap(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(map));
  } catch (e) {}
}

// Helper: load attempts array from localStorage
function getLocalAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Helper: save attempt to localStorage
function saveLocalAttempt(attempt) {
  try {
    const attempts = getLocalAttempts();
    attempts.push(attempt);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  } catch (e) {}
}

// Global Answers Helpers
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const API = {
  getGlobalAnswers() {
    try {
      return JSON.parse(localStorage.getItem('prawoJazdy_globalAnswers') || '{}');
    } catch (e) { return {}; }
  },
  
  getDailyStats() {
    try {
      return JSON.parse(localStorage.getItem('prawoJazdy_dailyStats') || '{}');
    } catch (e) { return {}; }
  },

  recordGlobalAnswer(questionId, isCorrect) {
    if (!questionId) return;
    
    // Update Global Answers map
    const answers = API.getGlobalAnswers();
    answers[questionId] = { correct: isCorrect, updated_at: new Date().toISOString() };
    localStorage.setItem('prawoJazdy_globalAnswers', JSON.stringify(answers));

    // Update Daily Stats tracking
    const daily = API.getDailyStats();
    const today = getTodayString();
    if (!daily[today]) {
      daily[today] = { correct: 0, wrong: 0 };
    }
    if (isCorrect) {
      daily[today].correct++;
    } else {
      daily[today].wrong++;
    }
    localStorage.setItem('prawoJazdy_dailyStats', JSON.stringify(daily));
  },

  // 1. Fetch Traffic Signs (Instant local lookup by category)
  async fetchTrafficSigns(category = null) {
    const allSigns = window.TRAFFIC_SIGNS_DATA || [];
    if (!category) return allSigns;
    
    const catClean = category.toLowerCase().trim();
    return allSigns.filter(s => 
      s.category && s.category.toLowerCase().trim().includes(catClean)
    );
  },

  // 2. Fetch Courses with Progress merged from localStorage
  async fetchCourses(category = "B") {
    const rawCourses = window.COURSE_MODULES_DATA || [];
    const progressMap = getLocalProgressMap();
    
    return rawCourses.map(course => {
      let totalLessons = 0;
      let completedLessons = 0;
      
      const modules = course.modules.map((mod, modIdx) => {
        let completedModuleTime = 0;
        
        const lessons = mod.lessons.map((lesson, lessonIdx) => {
          totalLessons++;
          const lessonId = lesson.id || (modIdx * 100 + lessonIdx + 1);
          const savedProgress = progressMap[lessonId] || {};
          
          const isComp = savedProgress.is_completed !== undefined ? savedProgress.is_completed : (lesson.is_completed || false);
          const watchedSec = savedProgress.watched_seconds !== undefined ? savedProgress.watched_seconds : (lesson.watched_seconds || 0);
          
          if (isComp) {
            completedLessons++;
            completedModuleTime += lesson.duration_seconds;
          } else {
            completedModuleTime += Math.min(watchedSec, lesson.duration_seconds);
          }
          
          return {
            ...lesson,
            id: lessonId,
            is_completed: isComp,
            watched_seconds: watchedSec
          };
        });
        
        return {
          ...mod,
          id: mod.id || (modIdx + 1),
          completed_duration_seconds: completedModuleTime,
          lessons
        };
      });
      
      const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons * 100.0) : 0.0;
      
      return {
        ...course,
        id: course.id || 1,
        overall_progress_percentage: Math.round(overallProgress * 100) / 100,
        modules
      };
    });
  },

  // 3. Update Lesson Progress in localStorage
  async updateProgress(lessonId, watchedSeconds, isCompleted) {
    const progressMap = getLocalProgressMap();
    const existing = progressMap[lessonId] || { watched_seconds: 0, is_completed: false };
    
    progressMap[lessonId] = {
      watched_seconds: Math.max(existing.watched_seconds || 0, watchedSeconds || 0),
      is_completed: isCompleted !== undefined ? isCompleted : existing.is_completed,
      updated_at: new Date().toISOString()
    };
    
    saveLocalProgressMap(progressMap);
    return progressMap[lessonId];
  },

  _ensureTestQuestionsLoaded() {
    if (window.__TEST_QUESTIONS_LOADED_FROM_COURSE) {
      return;
    }
    if (!window.COURSE_DATA) return;
    
    window.__TEST_QUESTIONS_LOADED_FROM_COURSE = true;
    window.TEST_QUESTIONS_DATA = [];
    let globalId = 1;
    window.COURSE_DATA.forEach(topic => {
      if (!topic.questions) return;
      topic.questions.forEach(q => {
        let question_type = q.answers && q.answers.length === 2 ? "BASIC" : "SPECIALIST";
        let correct_answer = null;
        let options = null;

        if (question_type === "BASIC") {
          const correct = q.answers.find(a => a.isCorrect);
          if (correct) {
            correct_answer = correct.text.trim().toUpperCase() === "TAK" ? "TAK" : "NIE";
          }
        } else {
          options = {};
          const labels = ["A", "B", "C", "D"];
          q.answers.forEach((ans, idx) => {
            options[labels[idx]] = ans.text;
            if (ans.isCorrect) correct_answer = labels[idx];
          });
        }

        let realId = globalId++;
        if (q.mediaUrl) {
          const match = q.mediaUrl.match(/\/(\d+)\.(jpg|mp4|png|jpeg)$/i);
          if (match) {
            realId = parseInt(match[1]);
          }
        }

        window.TEST_QUESTIONS_DATA.push({
          id: realId,
          category: "B",
          topic_id: topic.id || "general",
          question_type: question_type,
          question_text: q.title,
          media_url: q.mediaUrl || null,
          media_type: q.mediaType || "none",
          correct_answer: correct_answer,
          points: question_type === "BASIC" ? 3 : 2,
          options: options,
          explanation: q.explanation || ""
        });
      });
    });
  },

  // 4. Fetch Exam Questions
  async fetchExamQuestions(category = "B", limit = 32) {
    this._ensureTestQuestionsLoaded();
    const allQuestions = window.TEST_QUESTIONS_DATA || [];
    
    const basicQ = allQuestions.filter(q => q.question_type === "BASIC");
    const specialistQ = allQuestions.filter(q => q.question_type === "SPECIALIST");
    
    const shuffledBasic = basicQ.sort(() => 0.5 - Math.random()).slice(0, 20);
    const shuffledSpec = specialistQ.sort(() => 0.5 - Math.random()).slice(0, 12);
    
    const combined = [...shuffledBasic, ...shuffledSpec];
    return combined.length > 0 ? combined : allQuestions.slice(0, limit);
  },

  // 5. Submit Exam & Calculate Result locally
  async submitExam(answers, testType = "EXAM") {
    this._ensureTestQuestionsLoaded();
    const allQuestions = window.TEST_QUESTIONS_DATA || [];
    const questionsMap = {};
    allQuestions.forEach(q => { questionsMap[q.id] = q; });
    
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    const results = [];
    
    answers.forEach(ans => {
      const q = questionsMap[ans.question_id];
      if (!q) return;
      
      maxScore += q.points;
      const isCorrect = (ans.selected_answer || "").trim().toUpperCase() === (q.correct_answer || "").trim().toUpperCase();
      const pts = isCorrect ? q.points : 0;
      
      if (isCorrect) {
        correctCount++;
        totalScore += pts;
      }
      
      // Record answer into the new unified stats system
      API.recordGlobalAnswer(q.id, isCorrect);
      
      results.push({
        question_id: q.id,
        is_correct: isCorrect,
        correct_answer: q.correct_answer,
        points_awarded: pts,
        explanation: q.explanation
      });
    });
    
    const passed = totalScore >= 68 || (maxScore < 68 && totalScore === maxScore);
    
    const attempt = {
      id: Date.now(),
      test_type: testType,
      score: totalScore,
      max_score: maxScore > 0 ? maxScore : 74,
      passed: passed,
      total_questions: answers.length,
      correct_count: correctCount,
      attempted_at: new Date().toISOString()
    };
    
    saveLocalAttempt(attempt);
    return { attempt, results };
  },

  // 6. User Statistics from localStorage
  async fetchUserStats() {
    const progressMap = getLocalProgressMap();
    const attempts = getLocalAttempts();
    
    let totalWatchedSec = 0;
    let completedCount = 0;
    
    Object.values(progressMap).forEach(p => {
      if (p.is_completed) completedCount++;
      totalWatchedSec += (p.watched_seconds || 0);
    });
    
    const hours = Math.floor(totalWatchedSec / 3600);
    const mins = Math.floor((totalWatchedSec % 3600) / 60);
    const secs = totalWatchedSec % 60;
    const studyTimeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const testsTaken = attempts.length;
    const testsPassed = attempts.filter(a => a.passed).length;
    const avgScore = testsTaken > 0 
      ? Math.round((attempts.reduce((sum, a) => sum + a.score, 0) / testsTaken) * 10) / 10 
      : 0.0;
    const lastExamPassed = testsTaken > 0 ? attempts[attempts.length - 1].passed : null;
    
    return {
      overall_course_progress: Math.min(100, Math.round((completedCount / 10) * 100)),
      completed_lessons: completedCount,
      total_lessons: 10,
      total_study_time_formatted: studyTimeStr,
      tests_taken: testsTaken,
      tests_passed: testsPassed,
      average_score: avgScore,
      last_exam_passed: lastExamPassed
    };
  }
};

window.API = API;

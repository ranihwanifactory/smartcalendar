import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generatePlan = async (prompt: string, contextDate: string): Promise<string> => {
  if (!apiKey) {
    return "API Key가 설정되지 않았습니다. 환경 변수를 확인해주세요.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      당신은 2026년 달력 앱의 친절하고 유능한 AI 비서입니다.
      사용자의 일정 계획, 휴일 여행 추천, 기념일 축하 메시지 작성 등을 도와줍니다.
      현재 사용자가 보고 있는 달력의 기준 날짜는 ${contextDate}입니다.
      한국의 문화와 휴일 맥락을 잘 이해하고 답변해주세요.
      답변은 마크다운 형식을 사용하여 깔끔하게 정리해주세요.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "죄송합니다. 답변을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "요청을 처리하는 중에 오류가 발생했습니다.";
  }
};
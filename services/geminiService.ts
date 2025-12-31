
import { GoogleGenAI } from "@google/genai";
import { CalendarEvent } from "../types";

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

export const generateMonthlySummary = async (events: CalendarEvent[], monthName: string): Promise<string> => {
  if (!apiKey) return "API 키가 필요합니다.";
  
  const eventList = events.map(e => `- ${e.startDate}${e.startDate !== e.endDate ? ` ~ ${e.endDate}` : ''}: ${e.title} (${e.completed ? '완료' : '진행중'})`).join('\n');
  
  const prompt = `
    다음은 사용자의 ${monthName} 일정 목록입니다:
    ${eventList || '등록된 일정이 없습니다.'}
    
    이 일정들을 분석하여 다음 내용을 포함한 짧고 친절한 브리핑을 작성해주세요:
    1. 이번 달의 전체적인 바쁨 정도 (상/중/하)
    2. 가장 일정이 몰려있는 시기나 중요한 특징
    3. 생산성을 높이기 위한 조언이나 격려의 말
    
    답변은 한국어로, 친근한 말투(~해요)를 사용해 마크다운 형식으로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });
    return response.text || "브리핑을 생성할 수 없습니다.";
  } catch (error) {
    return "AI 브리핑 생성 중 오류가 발생했습니다.";
  }
};

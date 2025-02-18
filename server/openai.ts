import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function suggestTags(url: string, title: string, description: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that suggests relevant tags for bookmarks. Analyze the URL, title, and description to suggest 3-5 relevant tags. Respond with a JSON array of tag strings.",
        },
        {
          role: "user",
          content: `URL: ${url}\nTitle: ${title}\nDescription: ${description}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    const result = JSON.parse(content);
    return result.tags || [];
  } catch (error) {
    console.error("Failed to suggest tags:", error);
    return [];
  }
}
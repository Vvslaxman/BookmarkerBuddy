import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function suggestTags(url: string, title: string, description: string): Promise<{ tags: string[], error?: string }> {
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
      return { tags: [], error: "No suggestions generated" };
    }

    const result = JSON.parse(content);
    return { tags: result.tags || [] };
  } catch (error) {
    console.error("Failed to suggest tags:", error);
    let errorMessage = "Failed to generate tag suggestions";

    if ((error as any).status === 429) {
      errorMessage = "API rate limit exceeded. Please try again later.";
    } else if ((error as any).status === 401) {
      errorMessage = "Invalid API key. Please check your OpenAI API key configuration.";
    }

    return { tags: [], error: errorMessage };
    // Fallback to basic tag extraction
    // const combined = `${title} ${description}`.toLowerCase();
    // const words = combined.split(/[\s,.-]+/);
    // const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
    // const tags = [...new Set(words)]
    //   .filter(word => word.length > 2 && !commonWords.has(word))
    //   .slice(0, 5);
    // return { tags };
  }
}
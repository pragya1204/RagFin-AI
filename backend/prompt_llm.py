from groq import Groq
from langchain.prompts import PromptTemplate
from config import GROQ_API_KEY, GROQ_MODEL

# Instantiate the Groq client using the API key from config
try:
    client = Groq(api_key=GROQ_API_KEY)
    print("Groq client initialized successfully.")
except Exception as e:
    print(f"Error initializing Groq client: {e}")
    # Decide if you want to exit or handle this differently
    exit()

def build_prompt(query: str, context: str) -> str:
    """
    Builds the prompt for the LLM, including instructions and context.
    """
    # Note: Carefully craft this prompt based on desired AI behavior.
    # Consider adding instructions on how to handle insufficient context.
    prompt_template = """
You are RagFin AI, a smart AI-powered financial assistant. Your goal is to provide accurate, personalized, and up-to-date financial guidance based on the user's query and the provided context, which contains recent financial regulations, tax laws, and market information from official Indian sources like RBI and Income Tax department.

Analyze the user's query carefully. Use the relevant information from the context below to formulate your answer. Explain financial concepts clearly and provide actionable steps or suggestions where appropriate. If the context contains specific figures, dates, rules, or notification numbers relevant to the query, incorporate them accurately into your response.

Your response should be:
- Accurate and based on the provided context.
- Well-structured and easy to understand (use paragraphs, bullet points if helpful).
- Directly address the user's question.
- Maintain a helpful and informative tone.
- Avoid giving definitive investment advice (e.g., "You absolutely should buy X"). Instead, offer informative guidance, comparisons, pros/cons (e.g., "Investing in Y offers potential growth but carries risk Z, while option W provides stability... Check notification [number] for details.").
- If the query mentions personal details like income or savings, try to tailor the response accordingly, using the context as a basis for calculations or suggestions where applicable.
- If the context doesn't contain enough information to fully answer the query, state that clearly and suggest where the user might find more information or ask for clarifying details. Do not invent information not present in the context.

Context from recent financial data/notifications:
---------------------
{context}
---------------------

User Query: {query}


"""
    prompt = PromptTemplate(input_variables=["query", "context"], template=prompt_template)
    # Ensure context is not overly long for the prompt template limit
    # (This might need more sophisticated truncation based on model limits)
    formatted_prompt = prompt.format(query=query, context=context[:15000]) # Truncate context if too long
    return formatted_prompt

def get_llm_response(prompt: str) -> str:
    """
    Sends the prompt to the Groq LLM and returns the response.
    """
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL, # Ensure this model is available via your Groq API key
            messages=[
                # System message defines the AI's core persona and constraints
                {"role": "system", "content": "You are RagFin AI, an expert financial assistant providing informative guidance based on recent Indian financial regulations and data. Focus on accuracy and clarity, citing context where possible. Do not give speculative or definitive investment advice."},
                # User message contains the detailed instructions and context
                {"role": "user", "content": prompt}
            ],
            temperature=0.3, # Lower temperature for more factual, less creative responses
            # Consider adding max_tokens if needed to control response length
            # max_tokens=1024,
            # top_p=0.9 # Another way to control randomness, usually use temp OR top_p
        )
        # Check if response and choices are valid
        if response.choices and response.choices[0].message and response.choices[0].message.content:
             return response.choices[0].message.content.strip()
        else:
             print("Warning: LLM response structure unexpected or empty.")
             return "I apologize, but I encountered an issue generating a response. Please try again."

    except Exception as e:
        print(f"Error calling Groq API: {e}")
        # Provide a user-friendly error message
        return "I'm sorry, but I encountered an error while processing your request. Please check the server logs or try again later."


if __name__ == "__main__":
    # Example usage for testing this module directly
    print("\n--- Testing prompt_llm.py ---")
    sample_query = "I earn ₹80,000 per month. How can I save tax under the new tax regime based on recent notifications?"
    # Simulate context that might be retrieved by RAG
    sample_context = """
    Notification No. 15/2024 [F. No. XYZ]: The standard deduction of ₹50,000 remains available under the new tax regime for salaried individuals for FY 2023-24 (AY 2024-25).
    RBI Circular Ref ABC/123 dated Jan 2024: Interest rates on Small Saving Schemes like PPF remain unchanged at 7.1% for the Q1 2024-25. Investments up to ₹1.5 lakh in PPF qualify for deduction under Section 80C, but 80C deductions are NOT available under the new tax regime.
    """
    print(f"Sample Query: {sample_query}")
    print(f"Sample Context:\n{sample_context}")

    full_prompt = build_prompt(sample_query, sample_context)
    print("\nConstructed Prompt (first 300 chars):\n", full_prompt[:300], "...")

    print("\nGetting LLM response...")
    answer = get_llm_response(full_prompt)
    print("\nLLM Response:\n", answer)
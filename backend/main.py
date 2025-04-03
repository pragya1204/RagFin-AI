from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response

def main():
    user_query = input("Enter your cybersecurity query: ")
    retriever = get_retriever()
    docs = retriever.invoke(user_query)
    
    context_parts = []
    for doc in docs:
        # Use the 'text' key from metadata if available; otherwise, use page_content.
        text = doc.metadata.get("text") if "text" in doc.metadata and doc.metadata.get("text") else doc.page_content
        if text:
            context_parts.append(text)
        else:
            print("Found document with no text content. Skipping.")
    context = "\n\n".join(context_parts)
    
    print("Retrieved Context (first 500 characters):\n", context[:500], "\n")
    
    final_prompt = build_prompt(user_query, context)
    print("Final Prompt:\n", final_prompt, "\n")
    
    answer = get_llm_response(final_prompt)
    print("LLM Answer:\n", answer)

if __name__ == "__main__":
    main()

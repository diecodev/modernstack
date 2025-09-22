from settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import OpenAIEmbeddings, ChatOpenAI


statement_processing_model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", api_key=settings.google_api_key
)


transaction_embedding_model = ChatOpenAI(
    model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.2
)

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small", api_key=settings.openai_api_key
)

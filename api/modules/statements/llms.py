from settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import OpenAIEmbeddings


statement_processing_model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", api_key=settings.google_api_key
)

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small", api_key=settings.openai_api_key
)

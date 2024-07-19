from .config import *
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings,OpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain_community.callbacks.manager import get_openai_callback

def process_text(text):
    # Split the text into chunks using Langchain's CharacterTextSplitter
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    
    # Convert the chunks of text into embeddings to form a knowledge base
    embeddings = OpenAIEmbeddings(openai_api_key=OPEN_AI_API_KEY)
    knowledgeBase = FAISS.from_texts(chunks, embeddings)
    
    return knowledgeBase

def bot_response(knowledgeBase,user_query):
    query = user_query
    docs = knowledgeBase.similarity_search(user_query)
    llm = OpenAI(openai_api_key=OPEN_AI_API_KEY)
    chain = load_qa_chain(llm, chain_type='stuff')
            
    with get_openai_callback() as cost:
        response = chain.invoke({"input_documents":docs, "question":query})
    print(response["output_text"])
    return response["output_text"]



# knowledgebase = process_text("Think python is a book and it is a very good book")
# bot_response(knowledgebase, "What are sales")
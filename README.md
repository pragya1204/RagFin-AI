<h1>
  <img src="https://github.com/user-attachments/assets/3e6b5962-a670-4618-9040-b623524066fd" alt="logo ragfin" width="40" style="vertical-align: middle;"/>
  RagFin AI - Your Financial Copilot
</h1>

Empower individuals and small businesses with smart, AI-driven financial tools to simplify money management, automate tax filing, and make informed investment decisions—all from one seamless platform.

**RagFin AI** AI-powered Personal Finance & Tax Advisor integrates budgeting, tax filing, and investment planning into a single, seamless platform. Leveraging a RAG-based AI model, it automates data extraction, delivers personalized real-time financial insights, and adapts to regulatory changes, all while reducing manual effort.

Our Finetuned Model: https://huggingface.co/Deepesh-001/RagFin-Ai/tree/main

Our Self curated Custom dataset for finance laws and case studies: https://huggingface.co/datasets/Deepesh-001/Finance_taxlaws_casestudies/viewer/default/train?p=7&views%5B%5D=train



![WhatsApp Image 2025-04-04 at 21 21 46_6c4f5ab2](https://github.com/user-attachments/assets/cfbb1509-e104-4b11-857e-1bc5bead57e1)

<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## 🤖Retrieval-Augmented Generation (RAG)

Our platform uses a Retrieval-Augmented Generation (RAG) pipeline where user queries (like “Can I claim rent as a freelancer?”) are first processed and matched against a curated financial knowledge base using vector embeddings (via Pinecone). The most relevant documents are retrieved and passed to a GPT-4 model via LangChain, which generates personalized, context-aware financial or tax advice in real time—ensuring accurate and up-to-date responses every time.

This combines the power of search with generative AI for smarter financial decision-making.

![image](https://github.com/user-attachments/assets/c8d1252e-fa93-4e30-8a5d-6b1e0b335fc0)

<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## 🚀 Features

- 🤖 **AI-Powered Financial Advisor** – Personalized budgeting, tax tips & investment suggestions using a RAG-based model.
- 🧾 **Automated Tax Filing** – Real-time filing support with compliance updates.
- 📊 **Smart Budgeting Dashboard** – Income, expenses, and savings visualized in one place.
- 🔄 **Tax Laws & Investment Updates** – Provides users with latest circulars and notification regarding income laws and taxes.
- 🤝 **Context based tips** - Upload pdf of you financial detail and get personalized advices.

<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## 📸 Screenshots

![WhatsApp Image 2025-04-04 at 21 21 47_45a2009b](https://github.com/user-attachments/assets/9b8e8db3-7da0-46e5-93b0-2e99d0ac162e)

![WhatsApp Image 2025-04-04 at 22 37 03_5a6447ca](https://github.com/user-attachments/assets/e6480d5e-48b5-48fe-a870-50faa95b4a53)

![WhatsApp Image 2025-04-04 at 22 37 03_80fa7acd](https://github.com/user-attachments/assets/75219bbc-ac56-4ea7-a279-aca1fb75fb94)




<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## 📦 Technologies Used

RagFin AI is built using the following technologies:

<table>
	<tr>
  <td><img height=40 src = "https://skillicons.dev/icons?i=fastapi"></td>
	<td><strong>FastAPI</strong></td>
</tr>
	<tr>
  <td><img height=40 src = "https://skillicons.dev/icons?i=mongodb"></td>
	<td><strong>MongoDB</strong></td>
</tr>
<tr>
  <td><img height=40 src = "https://skillicons.dev/icons?i=nextjs"></td>
	<td><strong>NextJS</strong></td>
</tr>
<tr>
  <td><img height=40 src = "https://skillicons.dev/icons?i=nodejs"></td>
	<td><strong>NodeJS</strong></td>
</tr>
  <tr>
  <td><img height=40 src = "https://skillicons.dev/icons?i=ts"></td>
	<td><strong>TypeScript</strong></td>
</tr>
<tr>
  <td><img height=40 src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5GfZgF48-WVX8Ss5ncBaKJJkA7iOr0Ias5Q&s"></td>
	<td><strong>Hugging Face</strong></td>
</tr>
  
</table>

<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## Dependencies

![WhatsApp Image 2025-04-04 at 22 18 39_bb2e90ab](https://github.com/user-attachments/assets/13dd494c-a0f2-4b79-b9c0-ae71adf3b91b)


<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

##  🔧Setup Instructions

1. Clone Repository

git clone <your-repository-url>
cd pragya1204-ragfin-ai

2. Backend Setup

cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt

3. Configure Backend Environment

Create a .env file in the backend directory with:

PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_ENVIRONMENT="YOUR_PINECONE_ENVIRONMENT"
INDEX_NAME="finance2"
EMBEDDING_MODEL="sentence-transformers/all-roberta-large-v1"
GROQ_API_KEY="YOUR_GROQ_API_KEY"
GROQ_MODEL="llama3-8b-8192"
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
MONGODB_DB="ragfin"
MONGODB_COLLECTION="chats"

4. Frontend Setup

cd ../user
pnpm install   # or npm install

5. Configure Frontend Environment

Create a .env.local file in the user directory with:

NEXT_PUBLIC_BACKEND_URL="http://localhost:5001"

6. Pinecone Index Setup

    Log in to Pinecone.

    Create a new index named finance2 with 1024 dimensions and cosine metric.

7. Data Pipeline – Generate/Update Financial Data

cd WebScraping
python combine_json_file.py

(Ensure data.json is generated/updated with RBI notifications.)
8. Index Financial Documents

cd ../backend
# (Optional: Delete processed_ids.json to re-index)
python index.py

9. Run the Backend Server

python app.py

(Backend will run on http://127.0.0.1:5001)
10. Run the Frontend Server

cd ../user
pnpm dev   # or npm run dev

(Access via http://localhost:3000)

<!--line-->
<img src="https://www.animatedimages.org/data/media/562/animated-line-image-0184.gif" width="1920" />

## Our Team❤️

<table>
  <tr>
    <td><img height="140" src="https://media.licdn.com/dms/image/v2/D5603AQGC2L1ITKhxJQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729345963112?e=1749081600&v=beta&t=ScXNpte41ldbBPVXpOmNDRXEOWacJkNEDiJ71NvyJJY"></td>
    <td><strong>Pragya</strong></td>
  </tr>
  <tr>
    <td><img height="140" src="https://media.licdn.com/dms/image/v2/D4E03AQE-EOywD_3JaQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1693854018575?e=1749081600&v=beta&t=pgRs3_2e_sKmfsB6aV_IfLFO4FOUqYcxAAIcZ3QDLwI"></td>
    <td><strong>Suhani Aggarwal</strong></td>
  </tr>
  <tr>
    <td><img height="140" src="https://media.licdn.com/dms/image/v2/D5603AQGLFkEGa_7bfQ/profile-displayphoto-shrink_400_400/B56ZUy30SmGUAA-/0/1740315248984?e=1749081600&v=beta&t=msWXrR0mV7uWuq9rROAFO0Ey0OQAAFH9ViAC1qt4UfM"></td>
    <td><strong>Arpit Chaudhary</strong></td>
  </tr>
  <tr>
    <td><img height="140" src="https://media.licdn.com/dms/image/v2/D5603AQH1hw9YjylmhQ/profile-displayphoto-shrink_800_800/B56ZWGQFCMHEAc-/0/1741714117940?e=1749081600&v=beta&t=o3sOB-2nyoW_Wkx2Y4EpvjActcfQOVXmoYzFtogZVz8"></td>
    <td><strong>Deepesh Ahlawat</strong></td>
  </tr>
</table>

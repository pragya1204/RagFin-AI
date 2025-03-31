import os
import json
import time
import requests
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Set up download directory for PDFs
DOWNLOAD_DIR = os.path.abspath("pdfs")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def init_selenium(headless=True):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    # Disable built-in PDF viewer and force download if possible
    chrome_options.add_experimental_option("prefs", {
        "plugins.always_open_pdf_externally": True,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True
    })
    # Use webdriver-manager to get the proper ChromeDriver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

def download_pdf_via_requests(driver, pdf_url):
    """
    Loads the pdf_url in Selenium to set up cookies/session, then extracts cookies
    and uses a requests session to download the PDF.
    """
    # Load the PDF URL in Selenium to establish session cookies
    driver.get(pdf_url)
    time.sleep(2)  # Wait a short while for cookies to be set
    cookies = driver.get_cookies()  # Returns list of dicts with cookie data

    # Create a requests session and set cookies from Selenium
    session = requests.Session()
    for cookie in cookies:
        session.cookies.set(cookie['name'], cookie['value'])
    
    # Prepare headers to mimic a real browser request
    headers = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/115.0.0.0 Safari/537.36"),
        "Referer": "https://website.rbi.org.in/"
    }
    
    response = session.get(pdf_url, headers=headers, stream=True)
    if response.status_code == 200 and "application/pdf" in response.headers.get("Content-Type", "").lower():
        pdf_name = os.path.basename(pdf_url.split('?')[0])
        pdf_path = os.path.join(DOWNLOAD_DIR, pdf_name)
        with open(pdf_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded (via requests): {pdf_path}")
        return pdf_path
    else:
        print(f"Failed to download via requests: {pdf_url} (Status code: {response.status_code})")
        return None

def extract_text_from_pdf(pdf_path):
    """Extracts text from the PDF file using PyPDF2 and filters it to ASCII (0-127) characters."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        extracted_text = page.extract_text() or ''
        # Filter to only keep ASCII characters (0-127)
        filtered_text = ''.join(char if ord(char) < 128 else '' for char in extracted_text)
        text += filtered_text
    return text

def load_processed_notifications(json_file='rbi_notifications.json'):
    """Loads previously processed notifications from a JSON file."""
    if os.path.exists(json_file):
        with open(json_file, 'r') as f:
            return json.load(f)
    return {}

def save_processed_notifications(data, json_file='rbi_notifications.json'):
    """Saves notifications data into a JSON file."""
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=4)

def scrape_rbi_notifications(url):
    """
    Scrapes the notifications page for PDF links.
    Looks for PDF download links inside <div class="btn-wrap"> elements contained within <div class="row">.
    Returns a list (limited to top 10) of dictionaries with keys: 'title', 'pdf_url', and 'date'.
    """
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to fetch the website.")
        return []
    
    soup = BeautifulSoup(response.content, "html.parser")
    notifications = []
    
    # Find all div containers with class "row"
    rows = soup.find_all("div", class_="row")
    for row in rows:
        # Find all <div class="btn-wrap"> elements inside the row
        btn_wraps = row.find_all("div", class_="btn-wrap")
        for btn in btn_wraps:
            a_tag = btn.find("a", href=True, target="_blank")
            if a_tag and a_tag.get("href", "").lower().endswith(".pdf"):
                pdf_url = a_tag.get("href").strip()
                # If URL is relative, prepend the base domain
                if pdf_url.startswith("/"):
                    pdf_url = "https://website.rbi.org.in" + pdf_url
                # Use the file name as the title
                title = os.path.basename(pdf_url.split('?')[0])
                # Date is not provided on the new website, so leave it empty
                notifications.append({
                    "title": title,
                    "pdf_url": pdf_url,
                    "date": ""
                })
    return notifications[:10]

def main():
    url = "https://website.rbi.org.in/web/rbi/notifications"
    
    # Scrape the notifications from the new RBI website
    notifications = scrape_rbi_notifications(url)
    if not notifications:
        print("No notifications found.")
        return
    
    # Load already processed notifications from JSON
    processed = load_processed_notifications()
    
    # Initialize Selenium driver
    driver = init_selenium(headless=True)
    
    for notif in notifications:
        title = notif["title"]
        pdf_url = notif["pdf_url"]
        date = notif["date"]
        # Use title as a unique key to avoid reprocessing duplicates
        if title in processed:
            print(f"Notification already processed: {title}")
            continue
        
        print(f"Processing: {title}")
        # Use the new download approach (via Selenium session cookies + requests)
        pdf_path = download_pdf_via_requests(driver, pdf_url)
        if pdf_path:
            content = extract_text_from_pdf(pdf_path)
            processed[title] = {
                "pdf_url": pdf_url,
                "date": date,
                "content": content
            }
            print(f"Extracted and stored content for: {title}")
        else:
            print(f"Skipping extraction for: {title}")
    
    save_processed_notifications(processed)
    print("All notifications processed and stored in rbi_notifications.json")
    
    driver.quit()

if __name__ == "__main__":
    main()

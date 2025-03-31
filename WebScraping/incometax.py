import os
import json
import re
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

def init_selenium():
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # run headless
    chrome_options.add_argument("--disable-gpu")
    # Configure Chrome to automatically download PDFs instead of opening them
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": DOWNLOAD_DIR,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "plugins.always_open_pdf_externally": True
    })
    # Use webdriver-manager to get the correct ChromeDriver version
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

def selenium_download_pdf(driver, pdf_url, timeout=10):
    """
    Uses Selenium to open the PDF URL and download the file.
    Returns the local file path if successful, else None.
    """
    driver.get(pdf_url)
    # Derive PDF name from URL (remove extra parameters)
    pdf_name = os.path.basename(pdf_url.split('&')[0])
    pdf_path = os.path.join(DOWNLOAD_DIR, pdf_name)
    
    # Wait until the file is downloaded (or timeout)
    wait_time = 0
    while not os.path.exists(pdf_path) and wait_time < timeout:
        time.sleep(1)
        wait_time += 1
        
    if os.path.exists(pdf_path):
        print(f"Downloaded: {pdf_path}")
        return pdf_path
    else:
        print(f"Failed to download: {pdf_url}")
        return None

def extract_text_from_pdf(pdf_path):
    """Extracts text from the PDF file using PyPDF2."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ''
    return text

def filter_ascii(text):
    """
    Returns a new string containing only characters with Unicode code points less than 128.
    This effectively keeps only the ASCII characters.
    """
    return ''.join(c for c in text if ord(c) < 128)

def load_processed_pdfs(json_file='processed_pdfs.json'):
    """Loads previously processed PDF data from JSON."""
    if os.path.exists(json_file):
        with open(json_file, 'r') as f:
            return json.load(f)
    return {}

def save_processed_pdfs(data, json_file='processed_pdfs.json'):
    """Saves processed PDF data to JSON."""
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=4)

def scrape_notifications(base_url, notification_path):
    """
    Scrapes the notifications page to extract the latest 10 PDF details.
    Returns a list of dictionaries with pdf_name, pdf_url, publish_date, and notification_number.
    """
    url = f"{base_url}/{notification_path}"
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to fetch the website.")
        return []
    
    soup = BeautifulSoup(response.content, 'html.parser')
    notifications = []
    
    # Extract the latest 10 notifications using the onclick attribute
    for link in soup.find_all('a', class_='d-flex', onclick=True)[:10]:
        onclick_text = link['onclick']
        match = re.search(r"OpenFormByType\('([^']+)", onclick_text)
        if match:
            # Replace HTML entities and remove extra parameters
            raw_url = match.group(1).replace("&amp;", "&")
            pdf_url = raw_url.split('&')[0].strip()
            pdf_url = pdf_url if pdf_url.startswith('http') else f"{base_url}/{pdf_url.lstrip('/')}"
            pdf_name = os.path.basename(pdf_url)
            publish_date = link.find('span', class_='publishDate').text.strip()
            notification_number = link.find('span', class_='NotificationNumber').text.strip()
            notifications.append({
                "pdf_name": pdf_name,
                "pdf_url": pdf_url,
                "publish_date": publish_date,
                "notification_number": notification_number
            })
        else:
            print("Could not extract URL from onclick:", onclick_text)
    return notifications

def main():
    base_url = 'https://incometaxindia.gov.in'
    notification_path = 'pages/communications/index.aspx'
    
    # Initialize Selenium driver
    driver = init_selenium()
    
    # Load already processed PDFs from JSON
    processed_pdfs = load_processed_pdfs()
    
    # Scrape notifications for the latest 10 PDFs
    notifications = scrape_notifications(base_url, notification_path)
    
    for notification in notifications:
        pdf_name = notification["pdf_name"]
        pdf_url = notification["pdf_url"]
        
        if pdf_name in processed_pdfs:
            print(f"PDF already processed: {pdf_name}")
            continue
        
        print(f"Processing {pdf_name} ...")
        # Download PDF using Selenium
        pdf_path = selenium_download_pdf(driver, pdf_url)
        if pdf_path:
            extracted_text = extract_text_from_pdf(pdf_path)
            # Filter the text to keep only ASCII characters (Unicode code points < 128)
            filtered_text = filter_ascii(extracted_text)
            processed_pdfs[pdf_name] = {
                "url": pdf_url,
                "publish_date": notification["publish_date"],
                "notification_number": notification["notification_number"],
                "content": filtered_text
            }
            print(f"Extracted and stored text from {pdf_name}")
        else:
            print(f"Skipping extraction for {pdf_name} as the file was not downloaded.")
    
    save_processed_pdfs(processed_pdfs)
    print("All PDFs processed and stored in processed_pdfs.json")
    
    # Quit the Selenium driver
    driver.quit()

if __name__ == "__main__":
    main()

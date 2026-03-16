import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright
import os

def verify_frontend():
    # Start the Next.js server
    env = os.environ.copy()
    env["PORT"] = "3001"
    env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] = "pk_test_Y2xlcmsuY2xlcmsuZGV2JA=="
    env["CLERK_SECRET_KEY"] = "sk_test_12345"

    server_process = subprocess.Popen(
        ["npm", "start"],
        cwd="frontend",
        env=env
    )

    # Wait for the server to be ready
    for _ in range(30):
        try:
            response = urllib.request.urlopen("http://localhost:3001")
            if response.getcode() == 200:
                break
        except Exception:
            pass
        time.sleep(1)
    else:
        server_process.terminate()
        raise Exception("Next.js server failed to start")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Go to the home page where the NeuralMesh component is rendered (in the footer)
            page.goto("http://localhost:3001")

            # Scroll to the bottom to make the footer visible
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

            # Wait a bit for the canvas to render
            page.wait_for_timeout(2000)

            # Ensure no obvious errors are displayed on the page
            error_boundary = page.locator("text=Application error").count()
            if error_boundary > 0:
                print("React Error Boundary triggered")
                raise Exception("React Error Boundary triggered")

            print("Frontend verification passed: Home page loaded and scrolled to footer without errors.")

            browser.close()
    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    verify_frontend()

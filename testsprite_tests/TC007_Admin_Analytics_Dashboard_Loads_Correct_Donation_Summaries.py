import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Input username and password, then click login button
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('isahamid095@gmail.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Vadalov95.')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Analizler' tab to navigate to Analytics Dashboard page
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/main/div/div/div/div/div[3]/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Simulate a new donation submission to verify real-time dashboard update
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/main/div/div/div/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify monthly donation statistics load and match expected aggregated data
        monthly_trend_desc = await frame.locator('text=Son 6 ayın bağış miktarları').text_content()
        assert monthly_trend_desc == 'Son 6 ayın bağış miktarları'
        months = await frame.locator('xpath=//div[contains(text(),"Ocak") or contains(text(),"Şubat") or contains(text(),"Mart") or contains(text(),"Nisan") or contains(text(),"Mayıs") or contains(text(),"Haziran")]').all_text_contents()
        expected_months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran']
        assert months == expected_months
        # Note: donation amounts are shown as a chart, so we verify presence of amounts text
        donation_amounts_texts = await frame.locator('xpath=//text()[contains(.,"0") or contains(.,"20000") or contains(.,"40000") or contains(.,"60000") or contains(.,"80000")]').all_text_contents()
        expected_amounts = ['0', '20000', '40000', '60000', '80000']
        for amount in expected_amounts:
            assert any(amount in text for text in donation_amounts_texts)
          
        # Assertion: Verify donor-type based statistics categories display accurate counts and amounts
        aid_types = ['Gıda Yardımı', 'Nakdi Yardım', 'Eğitim Desteği', 'Sağlık Yardımı', 'Barınma Desteği']
        aid_percentages = ['35%', '25%', '20%', '12%', '8%']
        for aid_type, percentage in zip(aid_types, aid_percentages):
            aid_text = await frame.locator(f'text={aid_type}').text_content()
            percentage_text = await frame.locator(f'text={percentage}').text_content()
            assert aid_type in aid_text
            assert percentage in percentage_text
          
        # Assertion: Verify dashboard updates reflect latest donation data after new submissions
        last_updated_text = await frame.locator('xpath=//div[contains(text(),"Güncel durum özeti")]/following-sibling::div[contains(text(),"15:14")]').text_content()
        assert '15:14' in last_updated_text
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    
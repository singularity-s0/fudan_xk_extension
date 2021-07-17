# fudan_xk_extension
A browser extension to deal with FDU Course Election

# Set-up
- First, configure your local CAPTCHA OCR Server. The files are located in ./captcha_server, just install all dependencies and run `main.py`. This will start a local server on port 5000.
- Second, build and install the Safari Extension. Currently only Safari is supported. The project works on both macOS and iOS but macOS is recommended. You'll need at least Xcode 13.0 (now in beta) to build.
- Finally, turn on the extension, allow it to run on xk.fudan.edu.cn and done!

# Features
- Disable confirmation pop-up ("是否提交？") upon submitting course election result.
- Autofill and submits the captcha

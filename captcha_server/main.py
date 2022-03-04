import os
import sys
import muggle_ocr
import base64,time
from flask import Flask
from flask import request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OCR = muggle_ocr.SDK(model_type=muggle_ocr.ModelType.Captcha)

'''
post image=<@URLENCODE><@BASE64><@IMG_RAW></@IMG_RAW></@BASE64></@URLENCODE> to /img2text
'''

@app.route('/img2text', methods=['post'])
def img2text():
    '''
    接受接口调用者传来的图片内容
    '''
    base64_img = request.get_json(force=True)['image']
    if base64_img:
    	img_name = save2img(base64_img)
    	return identify_img(img_name)

    
def save2img(base64_img):
    '''
    将图片数据base64解码保存为文件
    '''
    bin_img = base64.b64decode(base64_img)
    img_name = '%s.png' % time.strftime('%Y%m%d%H%M%S',time.localtime(time.time()))
    f = open(img_name,'wb')
    f.write(bin_img)
    f.close()
    return img_name

def identify_img(img_name):
    '''
    调用muggler_ocr识别图片
    '''
    with open(img_name,'rb') as img:
    	picture_btyes = img.read()
    	img.close()
    os.remove(img_name)
    result = OCR.predict(image_bytes=picture_btyes)
    print(result, file=sys.stderr)
    return result

if __name__ == '__main__':
    app.run()

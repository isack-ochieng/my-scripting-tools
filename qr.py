import qrcode

def generate_qr(data, filename="qr_code.png"):
    img = qrcode.make(data)
    img.save(filename)
    print(f"Saved as {filename}")

if __name__ == "__main__":
    data = input("Enter data: ")
    filename = input("Enter filename: ") or "qr_code.png"
    generate_qr(data, filename)

# This is a python code for creating qr codes. 
# To use , run "python qr.py" 
# You must have installed python on your machine and the dependancy "python -m pip install qrcode[pil] pillow"
# I know , am great , y'all should build me a statue or something like that😂 , am very proud of my self rn , ama gonna spoil my self , byeee👋🏾
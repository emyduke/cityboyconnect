import base64
from io import BytesIO
import qrcode


def generate_qr_image(data_url):
    """Returns base64-encoded PNG of QR code for the given URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='#1a472a', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()

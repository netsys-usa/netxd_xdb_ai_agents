from Crypto.Cipher import PKCS1_OAEP

class RSAEncryption:
    def __init__(self):
        self.private_key = None
    
    def rsa_decrypt_oaep(self, ciphertext: bytes) -> bytes:
        cipher = PKCS1_OAEP.new(self.private_key)
        plaintext = cipher.decrypt(ciphertext)
        return plaintext
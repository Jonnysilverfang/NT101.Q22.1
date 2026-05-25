# Lab 2 - Block Cipher và Các Chế Độ Mã Hóa

## Giới thiệu

Lab 2 tập trung vào các thuật toán mã hóa khối hiện đại và các tính chất quan trọng khi mã hóa dữ liệu. Nội dung chính của lab là tìm hiểu cấu trúc Feistel, hiệu ứng Avalanche, thuật toán DES, thuật toán AES, các chế độ hoạt động của AES như ECB, CBC, CFB, OFB, CTR, đồng thời thực hành một số phép toán số học phục vụ mật mã học như kiểm tra số nguyên tố, tìm ước chung lớn nhất và tính lũy thừa modulo.

Thông qua lab này, sinh viên nắm được cách mã hóa khối hoạt động, cách dữ liệu được chia thành block, vai trò của khóa trong quá trình mã hóa, sự khác nhau giữa các mode mã hóa và lý do các thuật toán mật mã hiện đại cần có tính khuếch tán mạnh.

## Các khái niệm cơ bản

- **Block Cipher**: thuật toán mã hóa dữ liệu theo từng khối có kích thước cố định.
- **Plaintext**: bản rõ, là dữ liệu ban đầu trước khi mã hóa.
- **Ciphertext**: bản mã, là dữ liệu sau khi đã được mã hóa.
- **Key**: khóa bí mật dùng trong quá trình mã hóa và giải mã.
- **DES**: thuật toán mã hóa khối đối xứng, xử lý block 64 bit và dùng khóa hiệu dụng 56 bit.
- **AES**: thuật toán mã hóa khối đối xứng hiện đại, xử lý block 128 bit và hỗ trợ khóa 128/192/256 bit.
- **Mode of Operation**: chế độ hoạt động của mã hóa khối, dùng để mã hóa dữ liệu dài nhiều block.
- **ECB**: chế độ mã hóa từng block độc lập.
- **CBC**: chế độ mã hóa trong đó mỗi block phụ thuộc vào block trước đó.
- **CFB/OFB/CTR**: các chế độ biến block cipher thành dạng gần giống stream cipher.
- **Avalanche Effect**: hiệu ứng trong đó chỉ thay đổi nhỏ ở đầu vào sẽ làm đầu ra thay đổi rất lớn.
- **Modulo**: phép chia lấy dư, thường dùng trong các thuật toán mật mã.
- **Prime Number**: số nguyên tố, là số chỉ có hai ước là 1 và chính nó.

Công thức tổng quát của mã hóa đối xứng:

`C = E(K, P)`

`P = D(K, C)`

Trong đó:

- `P`: Plaintext
- `C`: Ciphertext
- `K`: Secret key
- `E`: Encryption function
- `D`: Decryption function

## Nội dung các nhiệm vụ

### Nhiệm vụ 2.1 - Cấu trúc Feistel và hiệu ứng Avalanche

Nhiệm vụ này mô phỏng một mạng Feistel đơn giản. Dữ liệu đầu vào được chia thành hai nửa trái và phải, sau đó qua nhiều vòng xử lý. Ở mỗi vòng, nửa phải được đưa vào hàm `F` cùng với khóa con, sau đó kết quả được XOR với nửa trái để tạo ra dữ liệu mới.

Công thức một vòng Feistel:

`L_i = R_{i-1}`

`R_i = L_{i-1} XOR F(R_{i-1}, K_i)`

Ý nghĩa của nhiệm vụ này là giúp hiểu nguyên lý hoạt động của các thuật toán mã hóa khối như DES. Khi thay đổi một bit nhỏ trong plaintext, kết quả sau các vòng Feistel có thể thay đổi đáng kể. Đây là biểu hiện của hiệu ứng Avalanche.

### Nhiệm vụ 2.2 - Các chế độ mã hóa AES

Nhiệm vụ này thực hiện mã hóa một plaintext bằng AES với nhiều chế độ hoạt động khác nhau như ECB, CBC, CFB, OFB và CTR.

AES là thuật toán mã hóa khối hiện đại, xử lý dữ liệu theo từng block 16 byte. Tuy nhiên, dữ liệu thực tế thường dài hơn một block, vì vậy cần các chế độ hoạt động để quy định cách mã hóa nhiều block liên tiếp.

Các chế độ được sử dụng:

- **ECB**: mỗi block được mã hóa độc lập.
- **CBC**: mỗi block plaintext được XOR với ciphertext của block trước trước khi mã hóa.
- **CFB**: dùng kết quả mã hóa trước đó để tạo dữ liệu phản hồi cho block tiếp theo.
- **OFB**: tạo ra keystream độc lập rồi XOR với plaintext.
- **CTR**: dùng bộ đếm để tạo keystream và mã hóa dữ liệu.

Ý nghĩa của nhiệm vụ này là giúp so sánh kết quả mã hóa giữa các mode và hiểu vì sao ECB thường không an toàn cho dữ liệu dài do có thể làm lộ pattern.

### Nhiệm vụ 2.3 - Khảo sát hiệu ứng Avalanche của DES

Nhiệm vụ này dùng DES để mã hóa hai plaintext gần giống nhau là `STAYHOME` và `STAYHOMA`. Hai bản rõ chỉ khác nhau một ký tự cuối, sau đó chương trình chuyển ciphertext sang dạng bit và đếm số bit khác nhau giữa hai bản mã.

DES là thuật toán mã hóa khối xử lý block 64 bit, tương đương 8 byte. Vì vậy, hai chuỗi `STAYHOME` và `STAYHOMA` đều có độ dài phù hợp để mã hóa trực tiếp bằng DES.

Ý nghĩa của nhiệm vụ này là quan sát hiệu ứng Avalanche. Một thuật toán mã hóa tốt cần làm cho đầu ra thay đổi mạnh dù đầu vào chỉ thay đổi rất nhỏ. Nếu số bit thay đổi trong ciphertext xấp xỉ một nửa tổng số bit, thuật toán có tính khuếch tán tốt.

### Nhiệm vụ 2.4 - Lan truyền lỗi trong các mode AES

Nhiệm vụ này tạo 1000 byte dữ liệu mẫu, mã hóa bằng AES với các mode ECB, CBC, CFB và OFB. Sau khi mã hóa, chương trình cố ý lật một bit trong ciphertext tại byte thứ 26, sau đó giải mã lại và kiểm tra những block plaintext nào bị hỏng.

Mục tiêu của nhiệm vụ là khảo sát sự lan truyền lỗi khi ciphertext bị thay đổi.

Đặc điểm lỗi của từng mode:

- **ECB**: lỗi trong một block ciphertext thường chỉ làm hỏng block plaintext tương ứng.
- **CBC**: lỗi trong một block ciphertext làm hỏng block plaintext hiện tại và ảnh hưởng đến block kế tiếp.
- **CFB**: lỗi có thể ảnh hưởng đến vị trí hiện tại và một phần dữ liệu sau đó.
- **OFB**: lỗi trong ciphertext thường chỉ làm sai bit tương ứng trong plaintext.
- **CTR**: tương tự OFB, lỗi thường không lan rộng sang nhiều block khác.

Ý nghĩa của nhiệm vụ này là giúp hiểu rằng cùng dùng AES nhưng mode khác nhau sẽ có cách lan truyền lỗi khác nhau.

### Nhiệm vụ 2.6 - Số nguyên tố và các phép toán số học trong mật mã

Nhiệm vụ này thực hiện các phép toán số học thường dùng trong mật mã học, bao gồm tạo số nguyên tố, kiểm tra số nguyên tố, tìm ước chung lớn nhất và tính lũy thừa modulo.

Các chức năng chính:

- Tạo số nguyên tố 8-bit, 16-bit và 64-bit.
- Tìm 10 số nguyên tố lớn nhất nhỏ hơn `2^89 - 1`.
- Kiểm tra một số nhỏ hơn `2^89 - 1` có phải số nguyên tố hay không.
- Tính ước chung lớn nhất của hai số nguyên lớn.
- Tính `a^x mod p`.

Một số thuật toán và kỹ thuật được sử dụng:

- **Trial Division**: kiểm tra nguyên tố bằng cách thử chia.
- **Miller-Rabin**: kiểm tra nguyên tố xác suất, phù hợp với số lớn.
- **Euclid Algorithm**: tìm ước chung lớn nhất.
- **Modular Exponentiation**: tính lũy thừa modulo hiệu quả.

Ý nghĩa của nhiệm vụ này là giúp hiểu nền tảng toán học của các hệ mật mã hiện đại như RSA, Diffie-Hellman và các thuật toán khóa công khai khác.

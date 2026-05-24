# Lab 1 - Classical Cryptography

## Giới thiệu

Lab 1 tập trung vào các thuật toán mã hóa cổ điển. Nội dung chính của lab là tìm hiểu cách mã hóa, giải mã và phá mã cơ bản thông qua một số thuật toán quen thuộc như Caesar Cipher, Monoalphabetic Substitution Cipher, Playfair Cipher, Vigenère Cipher và một số thuật toán mở rộng khác.

Thông qua lab này, sinh viên nắm được các khái niệm nền tảng trong mật mã học như plaintext, ciphertext, cipher, key, encryption, decryption, brute-force và frequency analysis.

## Các khái niệm cơ bản

- **Plaintext**: bản rõ, là thông điệp gốc có thể đọc được.
- **Ciphertext**: bản mã, là thông điệp sau khi đã được mã hóa.
- **Cipher**: thuật toán hoặc phương pháp mã hóa.
- **Key**: khóa dùng để mã hóa hoặc giải mã.
- **Encryption**: quá trình biến plaintext thành ciphertext.
- **Decryption**: quá trình biến ciphertext trở lại plaintext.

Công thức tổng quát:

`C = E(K, P)`  
`P = D(K, C)`

Trong đó:

- `P`: Plaintext
- `C`: Ciphertext
- `K`: Key
- `E`: Encryption function
- `D`: Decryption function

## Nội dung các nhiệm vụ

### Nhiệm vụ 2.1 - Caesar Cipher

Nhiệm vụ này thực hiện mã hóa, giải mã và brute-force Caesar Cipher. Caesar Cipher là một thuật toán mã hóa thay thế đơn giản, trong đó mỗi ký tự trong plaintext được dịch đi một số vị trí cố định trong bảng chữ cái dựa trên khóa `K`.

Công thức mã hóa:

`C = (P + K) mod 26`

Công thức giải mã:

`P = (C - K) mod 26`

Ý nghĩa của nhiệm vụ này là giúp hiểu nguyên lý cơ bản của mã hóa thay thế và lý do Caesar Cipher không an toàn trong thực tế, vì số lượng khóa rất ít nên có thể bị phá bằng brute-force.

### Nhiệm vụ 2.2 - Monoalphabetic Substitution Cipher và Frequency Analysis

Nhiệm vụ này tìm hiểu cách giải mã văn bản được mã hóa bằng Monoalphabetic Substitution Cipher thông qua phương pháp Frequency Analysis.

Monoalphabetic Substitution Cipher là thuật toán thay thế mỗi ký tự plaintext bằng một ký tự ciphertext cố định trong toàn bộ văn bản. Do ánh xạ là cố định, tần suất xuất hiện của các ký tự trong ngôn ngữ tự nhiên vẫn được giữ lại trong ciphertext. Vì vậy, có thể sử dụng Frequency Analysis để phân tích và suy đoán bản rõ.

Phương pháp này thường dựa trên việc đếm tần suất xuất hiện của các ký tự hoặc các cụm ký tự phổ biến, sau đó so sánh với đặc trưng thống kê của tiếng Anh để tìm ra bảng ánh xạ phù hợp.

### Nhiệm vụ 2.3 - Tự động giải Monoalphabetic Substitution Cipher

Nhiệm vụ này xây dựng chương trình hỗ trợ tự động giải Monoalphabetic Substitution Cipher khi chỉ biết ciphertext.

Chương trình sẽ dựa vào các đặc trưng thống kê của ngôn ngữ để đánh giá mức độ hợp lý của các bản giải mã, từ đó tìm ra plaintext có khả năng đúng cao nhất. Một số hướng tiếp cận có thể dùng là unigram, bigram, trigram scoring hoặc các kỹ thuật tối ưu như hill-climbing, random restart và simulated annealing.

Ý nghĩa của nhiệm vụ này là giúp hiểu rằng việc phá mã cổ điển có thể được tự động hóa thông qua thống kê và thuật toán tìm kiếm.

### Nhiệm vụ 2.4 - Playfair Cipher

Nhiệm vụ này thực hiện mã hóa và giải mã bằng Playfair Cipher.

Playfair Cipher là thuật toán mã hóa theo từng cặp ký tự, sử dụng ma trận khóa 5x5 được tạo từ keyword. Trước khi mã hóa, plaintext được chia thành từng cặp ký tự. Nếu hai ký tự trong cùng một cặp giống nhau thì chèn thêm `X`, và nếu còn dư một ký tự cuối thì cũng thêm `X` để tạo thành cặp hoàn chỉnh.

Quy tắc mã hóa gồm ba trường hợp:

- Nếu hai ký tự cùng hàng, thay mỗi ký tự bằng ký tự bên phải nó.
- Nếu hai ký tự cùng cột, thay mỗi ký tự bằng ký tự bên dưới nó.
- Nếu hai ký tự khác hàng và khác cột, lấy hai ký tự ở hai góc còn lại của hình chữ nhật.

Ý nghĩa của nhiệm vụ này là giúp hiểu cách một thuật toán mã hóa theo cặp ký tự hoạt động và vì sao nó mạnh hơn Caesar Cipher.

### Nhiệm vụ 2.5 - Vigenère Cipher

Nhiệm vụ này thực hiện mã hóa và giải mã bằng Vigenère Cipher.

Vigenère Cipher là thuật toán mã hóa thay thế đa bảng. Khác với Caesar Cipher chỉ dùng một độ dịch cố định, Vigenère sử dụng một chuỗi khóa và lặp lại khóa này theo độ dài plaintext. Mỗi ký tự trong plaintext sẽ được mã hóa dựa trên ký tự tương ứng trong key.

Công thức mã hóa:

`C = (P + K) mod 26`

Công thức giải mã:

`P = (C - K) mod 26`

Ý nghĩa của nhiệm vụ này là giúp hiểu sự khác nhau giữa mã thay thế đơn bảng và mã thay thế đa bảng. Vigenère mạnh hơn Caesar nhưng vẫn có thể bị phá nếu khóa ngắn hoặc lặp lại nhiều lần.

### Nhiệm vụ 2.6 - Phá mã Vigenère Cipher

Nhiệm vụ này tìm hiểu cách phá Vigenère Cipher khi không biết trước key.

Do key trong Vigenère thường được lặp lại, ciphertext có thể xuất hiện các mẫu lặp. Từ đó có thể suy đoán độ dài khóa bằng các phương pháp như **Kasiski Examination** hoặc **Index of Coincidence**. Sau khi xác định được độ dài khóa, ciphertext được chia thành các nhóm, và mỗi nhóm có thể được xử lý gần giống như một Caesar Cipher để tìm từng ký tự của key.

Ý nghĩa của nhiệm vụ này là cho thấy Vigenère Cipher tuy mạnh hơn Caesar nhưng vẫn chưa đủ an toàn nếu khóa không được sử dụng đúng cách.

### Nhiệm vụ 2.7 - Thuật toán cổ điển mở rộng

Nhiệm vụ này thực hiện thêm một thuật toán mã hóa cổ điển khác tùy theo yêu cầu hoặc lựa chọn trong bài làm, ví dụ như Rail Fence Cipher, Affine Cipher, Hill Cipher hoặc Transposition Cipher.

Ý nghĩa của nhiệm vụ này là mở rộng hiểu biết về các dạng mã hóa cổ điển ngoài Caesar, Playfair và Vigenère.

## Tổng kết

| Nhiệm vụ | Nội dung | Ý chính |
|----------|----------|---------|
| 2.1 | Caesar Cipher | Mã hóa, giải mã và brute-force bằng khóa dịch chuyển |
| 2.2 | Monoalphabetic + Frequency Analysis | Phá mã thay thế đơn bảng bằng thống kê tần suất |
| 2.3 | Auto-solve Monoalphabetic Cipher | Tự động phá mã bằng thống kê và thuật toán tìm kiếm |
| 2.4 | Playfair Cipher | Mã hóa theo cặp ký tự bằng ma trận khóa 5x5 |
| 2.5 | Vigenère Cipher | Mã hóa đa bảng với khóa dạng chuỗi |
| 2.6 | Attack Vigenère | Tìm độ dài khóa rồi phân tích tần suất |
| 2.7 | Thuật toán mở rộng | Rail Fence, Affine, Hill hoặc Transposition |

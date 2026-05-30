using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace DoAnCryptoWeb;

public sealed record PlayfairStep(string OriginalPair, string ProcessedPair, string Rule, string ResultPair);
public sealed record PlayfairDetailedResult(string Result, string[][] Matrix, List<PlayfairStep> Steps);
public sealed record RsaKeyInspection(string Type, int KeySize, string ModulusHex, long Exponent, string SecurityAssessment);

public static class CryptoService
{
    public static string PlayfairEncrypt(string plainText, string key)
    {
        char[,] matrix = BuildPlayfairMatrix(key);
        string prepared = PreparePlayfairPlainText(plainText);
        return TransformPlayfair(prepared, matrix, encrypt: true);
    }

    public static string PlayfairDecrypt(string cipherText, string key)
    {
        char[,] matrix = BuildPlayfairMatrix(key);
        string prepared = NormalizeLetters(cipherText);
        if (prepared.Length == 0 || prepared.Length % 2 != 0)
        {
            throw new InvalidOperationException("Bản mã PlayFair phải chỉ gồm chữ cái và có độ dài chẵn.");
        }

        string decrypted = TransformPlayfair(prepared, matrix, encrypt: false);
        return CleanupPlayfairPlainText(decrypted);
    }

    public static PlayfairDetailedResult PlayfairEncryptDetailed(string plainText, string key)
    {
        char[,] matrix = BuildPlayfairMatrix(key);
        string prepared = PreparePlayfairPlainText(plainText);
        List<PlayfairStep> steps = new();
        string result = TransformPlayfairDetailed(prepared, matrix, encrypt: true, steps);

        string[][] matrixOutput = new string[5][];
        for (int r = 0; r < 5; r++)
        {
            matrixOutput[r] = new string[5];
            for (int c = 0; c < 5; c++)
            {
                matrixOutput[r][c] = matrix[r, c].ToString();
            }
        }

        return new PlayfairDetailedResult(result, matrixOutput, steps);
    }

    public static PlayfairDetailedResult PlayfairDecryptDetailed(string cipherText, string key)
    {
        char[,] matrix = BuildPlayfairMatrix(key);
        string prepared = NormalizeLetters(cipherText);
        if (prepared.Length == 0 || prepared.Length % 2 != 0)
        {
            throw new InvalidOperationException("Bản mã PlayFair phải chỉ gồm chữ cái và có độ dài chẵn.");
        }

        List<PlayfairStep> steps = new();
        string decrypted = TransformPlayfairDetailed(prepared, matrix, encrypt: false, steps);
        string result = CleanupPlayfairPlainText(decrypted);

        string[][] matrixOutput = new string[5][];
        for (int r = 0; r < 5; r++)
        {
            matrixOutput[r] = new string[5];
            for (int c = 0; c < 5; c++)
            {
                matrixOutput[r][c] = matrix[r, c].ToString();
            }
        }

        return new PlayfairDetailedResult(result, matrixOutput, steps);
    }

    public static string RsaEncrypt(string plainText, string publicKeyPem)
    {
        if (string.IsNullOrWhiteSpace(plainText))
        {
            throw new InvalidOperationException("Nhập nội dung cần mã hóa.");
        }

        if (string.IsNullOrWhiteSpace(publicKeyPem))
        {
            throw new InvalidOperationException("Nhập khóa công khai RSA.");
        }

        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(publicKeyPem);

        byte[] source = Encoding.UTF8.GetBytes(plainText);
        byte[] encrypted = rsa.Encrypt(source, RSAEncryptionPadding.OaepSHA256);
        return Convert.ToBase64String(encrypted);
    }

    public static string RsaDecrypt(string cipherTextBase64, string privateKeyPem)
    {
        if (string.IsNullOrWhiteSpace(cipherTextBase64))
        {
            throw new InvalidOperationException("Nhập bản mã Base64 cần giải mã.");
        }

        if (string.IsNullOrWhiteSpace(privateKeyPem))
        {
            throw new InvalidOperationException("Nhập khóa bí mật RSA.");
        }

        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(privateKeyPem);

        byte[] cipherBytes = Convert.FromBase64String(cipherTextBase64.Trim());
        byte[] decrypted = rsa.Decrypt(cipherBytes, RSAEncryptionPadding.OaepSHA256);
        return Encoding.UTF8.GetString(decrypted);
    }

    public static RsaKeyInspection InspectRsaKey(string pemKey)
    {
        if (string.IsNullOrWhiteSpace(pemKey))
        {
            throw new InvalidOperationException("Nhập khóa RSA cần phân tích.");
        }

        string trimmed = pemKey.Trim();
        bool isPrivate = trimmed.Contains("PRIVATE KEY");
        bool isPublic = trimmed.Contains("PUBLIC KEY");

        if (!isPrivate && !isPublic)
        {
            throw new InvalidOperationException("Định dạng khóa không hợp lệ. Phải chứa -----BEGIN PUBLIC KEY----- hoặc -----BEGIN PRIVATE KEY-----");
        }

        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(trimmed);

        RSAParameters rsaParams = rsa.ExportParameters(includePrivateParameters: false);
        int keySize = rsa.KeySize;
        string modulusHex = Convert.ToHexString(rsaParams.Modulus ?? Array.Empty<byte>());

        byte[] exponentBytes = rsaParams.Exponent ?? Array.Empty<byte>();
        long exponentValue = 0;
        foreach (byte b in exponentBytes)
        {
            exponentValue = (exponentValue << 8) + b;
        }

        string securityAssessment = keySize switch
        {
            < 2048 => "Yếu (Không an toàn, dễ bị bẻ khóa bằng máy tính thường)",
            2048 => "Đạt yêu cầu (Tiêu chuẩn bảo mật hiện tại)",
            _ => "Rất mạnh (Khuyên dùng cho các hệ thống bảo mật cao)"
        };

        return new RsaKeyInspection(
            Type: isPrivate ? "Khóa bí mật (Private Key)" : "Khóa công khai (Public Key)",
            KeySize: keySize,
            ModulusHex: modulusHex,
            Exponent: exponentValue,
            SecurityAssessment: securityAssessment
        );
    }

    public static byte[] EncryptFileHybrid(byte[] fileData, string publicKeyPem)
    {
        if (fileData == null || fileData.Length == 0)
        {
            throw new InvalidOperationException("Nội dung file trống.");
        }

        if (string.IsNullOrWhiteSpace(publicKeyPem))
        {
            throw new InvalidOperationException("Cần nhập khóa công khai RSA của người nhận.");
        }

        // 1. Generate random AES key (256-bit) and IV (12-byte GCM)
        byte[] aesKey = new byte[32];
        byte[] nonce = new byte[12];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(aesKey);
            rng.GetBytes(nonce);
        }

        // 2. Encrypt file data using AES-GCM
        byte[] cipherText = new byte[fileData.Length];
        byte[] tag = new byte[16];
        using (var aesGcm = new AesGcm(aesKey, tagSizeInBytes: 16))
        {
            aesGcm.Encrypt(nonce, fileData, cipherText, tag);
        }

        // 3. Encrypt AES key using RSA Public Key
        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(publicKeyPem);
        byte[] encryptedAesKey = rsa.Encrypt(aesKey, RSAEncryptionPadding.OaepSHA256);

        // 4. Assemble package: [Int32 key length] + [encrypted key] + [12 bytes IV] + [16 bytes tag] + [ciphertext]
        using MemoryStream ms = new();
        using (BinaryWriter writer = new(ms))
        {
            writer.Write(encryptedAesKey.Length);
            writer.Write(encryptedAesKey);
            writer.Write(nonce);
            writer.Write(tag);
            writer.Write(cipherText);
        }

        return ms.ToArray();
    }

    public static byte[] DecryptFileHybrid(byte[] encryptedPackage, string privateKeyPem)
    {
        if (encryptedPackage == null || encryptedPackage.Length < 32)
        {
            throw new InvalidOperationException("Gói tin mã hóa không hợp lệ hoặc bị lỗi dữ liệu.");
        }

        if (string.IsNullOrWhiteSpace(privateKeyPem))
        {
            throw new InvalidOperationException("Cần nhập khóa bí mật RSA tương ứng để giải mã.");
        }

        try
        {
            using MemoryStream ms = new(encryptedPackage);
            using BinaryReader reader = new(ms);

            int encryptedKeyLen = reader.ReadInt32();
            if (encryptedKeyLen <= 0 || encryptedKeyLen > encryptedPackage.Length)
            {
                throw new InvalidOperationException("Kích thước khóa mã hóa trong gói không hợp lệ.");
            }

            byte[] encryptedAesKey = reader.ReadBytes(encryptedKeyLen);
            byte[] nonce = reader.ReadBytes(12);
            byte[] tag = reader.ReadBytes(16);
            byte[] cipherText = reader.ReadBytes((int)(ms.Length - ms.Position));

            // 1. Decrypt AES key with RSA Private Key
            using RSA rsa = RSA.Create();
            rsa.ImportFromPem(privateKeyPem);
            byte[] aesKey = rsa.Decrypt(encryptedAesKey, RSAEncryptionPadding.OaepSHA256);

            // 2. Decrypt cipherText with AES key
            byte[] decryptedData = new byte[cipherText.Length];
            using (var aesGcm = new AesGcm(aesKey, tagSizeInBytes: 16))
            {
                aesGcm.Decrypt(nonce, cipherText, tag, decryptedData);
            }

            return decryptedData;
        }
        catch (CryptographicException ex)
        {
            throw new InvalidOperationException("Giải mã thất bại. Vui lòng kiểm tra lại khóa bí mật RSA hoặc tính toàn vẹn của file.", ex);
        }
    }

    private static string TransformPlayfair(string input, char[,] matrix, bool encrypt)
    {
        Dictionary<char, (int Row, int Col)> positions = BuildPositionMap(matrix);
        StringBuilder builder = new();
        int step = encrypt ? 1 : -1;

        for (int i = 0; i < input.Length; i += 2)
        {
            char first = input[i];
            char second = input[i + 1];
            (int row, int col) pos1 = positions[first];
            (int row, int col) pos2 = positions[second];

            if (pos1.row == pos2.row)
            {
                builder.Append(matrix[pos1.row, Mod5(pos1.col + step)]);
                builder.Append(matrix[pos2.row, Mod5(pos2.col + step)]);
            }
            else if (pos1.col == pos2.col)
            {
                builder.Append(matrix[Mod5(pos1.row + step), pos1.col]);
                builder.Append(matrix[Mod5(pos2.row + step), pos2.col]);
            }
            else
            {
                builder.Append(matrix[pos1.row, pos2.col]);
                builder.Append(matrix[pos2.row, pos1.col]);
            }
        }

        return builder.ToString();
    }

    private static string TransformPlayfairDetailed(string input, char[,] matrix, bool encrypt, List<PlayfairStep> steps)
    {
        Dictionary<char, (int Row, int Col)> positions = BuildPositionMap(matrix);
        StringBuilder builder = new();
        int stepValue = encrypt ? 1 : -1;

        for (int i = 0; i < input.Length; i += 2)
        {
            char first = input[i];
            char second = input[i + 1];
            (int row, int col) pos1 = positions[first];
            (int row, int col) pos2 = positions[second];

            char res1, res2;
            string rule;

            if (pos1.row == pos2.row)
            {
                res1 = matrix[pos1.row, Mod5(pos1.col + stepValue)];
                res2 = matrix[pos2.row, Mod5(pos2.col + stepValue)];
                rule = encrypt ? "Cùng hàng: Dịch sang phải" : "Cùng hàng: Dịch sang trái";
            }
            else if (pos1.col == pos2.col)
            {
                res1 = matrix[Mod5(pos1.row + stepValue), pos1.col];
                res2 = matrix[Mod5(pos2.row + stepValue), pos2.col];
                rule = encrypt ? "Cùng cột: Dịch xuống dưới" : "Cùng cột: Dịch lên trên";
            }
            else
            {
                res1 = matrix[pos1.row, pos2.col];
                res2 = matrix[pos2.row, pos1.col];
                rule = "Khác hàng và cột: Tạo hình chữ nhật, hoán đổi hai góc cùng hàng";
            }

            builder.Append(res1);
            builder.Append(res2);

            steps.Add(new PlayfairStep(
                OriginalPair: $"{first}{second}",
                ProcessedPair: $"{res1}{res2}",
                Rule: rule,
                ResultPair: $"{res1}{res2}"
            ));
        }

        return builder.ToString();
    }

    private static string PreparePlayfairPlainText(string input)
    {
        string normalized = NormalizeLetters(input);
        if (normalized.Length == 0)
        {
            throw new InvalidOperationException("Nhập văn bản cần mã hóa PlayFair.");
        }

        StringBuilder builder = new();
        int index = 0;

        while (index < normalized.Length)
        {
            char first = normalized[index];
            char second = index + 1 < normalized.Length ? normalized[index + 1] : 'X';

            if (first == second)
            {
                builder.Append(first);
                builder.Append(first == 'X' ? 'Q' : 'X');
                index++;
            }
            else
            {
                builder.Append(first);
                builder.Append(second);
                index += 2;
            }
        }

        if (builder.Length % 2 != 0)
        {
            builder.Append('X');
        }

        return builder.ToString();
    }

    private static char[,] BuildPlayfairMatrix(string key)
    {
        string normalizedKey = NormalizeLetters(key);
        if (normalizedKey.Length == 0)
        {
            throw new InvalidOperationException("Nhập khóa PlayFair.");
        }

        StringBuilder uniqueChars = new();
        HashSet<char> seen = [];

        foreach (char ch in normalizedKey + "ABCDEFGHIKLMNOPQRSTUVWXYZ")
        {
            if (seen.Add(ch))
            {
                uniqueChars.Append(ch);
            }
        }

        char[,] matrix = new char[5, 5];
        for (int i = 0; i < 25; i++)
        {
            matrix[i / 5, i % 5] = uniqueChars[i];
        }

        return matrix;
    }

    private static Dictionary<char, (int Row, int Col)> BuildPositionMap(char[,] matrix)
    {
        Dictionary<char, (int Row, int Col)> positions = [];

        for (int row = 0; row < 5; row++)
        {
            for (int col = 0; col < 5; col++)
            {
                positions[matrix[row, col]] = (row, col);
            }
        }

        return positions;
    }

    private static string NormalizeLetters(string value)
    {
        StringBuilder builder = new();

        foreach (char rawChar in value.ToUpperInvariant())
        {
            if (rawChar is >= 'A' and <= 'Z')
            {
                builder.Append(rawChar == 'J' ? 'I' : rawChar);
            }
        }

        return builder.ToString();
    }

    private static string CleanupPlayfairPlainText(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        StringBuilder builder = new();

        for (int i = 0; i < value.Length; i++)
        {
            char current = value[i];
            bool isInsertedMiddlePadding =
                i > 0 &&
                i < value.Length - 1 &&
                (current == 'X' || current == 'Q') &&
                value[i - 1] == value[i + 1];

            bool isTrailingPadding =
                i == value.Length - 1 &&
                (current == 'X' || current == 'Q');

            if (!isInsertedMiddlePadding && !isTrailingPadding)
            {
                builder.Append(current);
            }
        }

        return builder.ToString();
    }

    private static int Mod5(int value)
    {
        return (value % 5 + 5) % 5;
    }
}

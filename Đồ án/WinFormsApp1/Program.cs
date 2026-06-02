using System.Security.Cryptography;
using DoAnCryptoWeb;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5000");

WebApplication app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", app = "DoAnCryptoWeb" }));

app.MapPost("/api/playfair/encrypt", (PlayfairRequest request) =>
    RunCryptoAction(() => new CryptoResponse(
        CryptoService.PlayfairEncrypt(request.Text, request.Key),
        "PlayFair: đã mã hóa xong. Chỉ xử lý chữ A-Z, bỏ qua số và ký tự đặc biệt.")));

app.MapPost("/api/playfair/decrypt", (PlayfairRequest request) =>
    RunCryptoAction(() => new CryptoResponse(
        CryptoService.PlayfairDecrypt(request.Text, request.Key),
        "PlayFair: đã giải mã xong. Kết quả trả về là bản rõ đã chuẩn hóa theo PlayFair.")));

app.MapPost("/api/playfair/encrypt-steps", (PlayfairRequest request) =>
    RunCryptoAction(() => CryptoService.PlayfairEncryptDetailed(request.Text, request.Key)));

app.MapPost("/api/playfair/decrypt-steps", (PlayfairRequest request) =>
    RunCryptoAction(() => CryptoService.PlayfairDecryptDetailed(request.Text, request.Key)));

app.MapPost("/api/rsa/generate", (RsaKeyRequest request) =>
    RunCryptoAction(() =>
    {
        int keySize = request.KeySize is 1024 or 2048 or 3072 or 4096 ? request.KeySize : 2048;
        var (pubKey, privKey) = CryptoService.GenerateCustomRsaKeys(keySize);

        return new RsaKeyResponse(
            pubKey,
            privKey,
            $"RSA: đã tạo cặp khóa {keySize}-bit bằng thuật toán thủ công.");
    }));

app.MapPost("/api/rsa/encrypt", (RsaCryptoRequest request) =>
    RunCryptoAction(() => new CryptoResponse(
        CryptoService.RsaEncrypt(request.Text, request.PublicKey),
        "RSA: đã mã hóa xong bằng khóa công khai.")));

app.MapPost("/api/rsa/decrypt", (RsaCryptoRequest request) =>
    RunCryptoAction(() => new CryptoResponse(
        CryptoService.RsaDecrypt(request.Text, request.PrivateKey),
        "RSA: đã giải mã xong bằng khóa bí mật.")));

app.MapPost("/api/rsa/inspect-key", (RsaInspectRequest request) =>
    RunCryptoAction(() => CryptoService.InspectRsaKey(request.Key)));

app.MapPost("/api/rsa/encrypt-file", async (HttpContext context) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        var file = form.Files.GetFile("file");
        var publicKey = form["publicKey"].ToString();

        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { error = "Vui lòng chọn file cần mã hóa." });
        }

        if (string.IsNullOrWhiteSpace(publicKey))
        {
            return Results.BadRequest(new { error = "Vui lòng cung cấp khóa công khai RSA." });
        }

        byte[] fileBytes;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            fileBytes = ms.ToArray();
        }

        byte[] encryptedPackage = CryptoService.EncryptFileHybrid(fileBytes, publicKey);

        string originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
        string downloadName = $"{originalFileName}.enc";

        return Results.File(encryptedPackage, "application/octet-stream", downloadName);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/rsa/decrypt-file", async (HttpContext context) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        var file = form.Files.GetFile("file");
        var privateKey = form["privateKey"].ToString();

        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { error = "Vui lòng chọn file .enc cần giải mã." });
        }

        if (string.IsNullOrWhiteSpace(privateKey))
        {
            return Results.BadRequest(new { error = "Vui lòng cung cấp khóa bí mật RSA." });
        }

        byte[] fileBytes;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            fileBytes = ms.ToArray();
        }

        byte[] decryptedData = CryptoService.DecryptFileHybrid(fileBytes, privateKey);

        string originalFileName = file.FileName;
        string downloadName = originalFileName.EndsWith(".enc", StringComparison.OrdinalIgnoreCase)
            ? originalFileName.Substring(0, originalFileName.Length - 4)
            : $"decrypted_{originalFileName}";

        return Results.File(decryptedData, "application/octet-stream", downloadName);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.Run();

static IResult RunCryptoAction<T>(Func<T> action)
{
    try
    {
        return Results.Ok(action());
    }
    catch (Exception ex) when (ex is InvalidOperationException or ArgumentException or FormatException or CryptographicException)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
}

internal sealed record PlayfairRequest(string Text, string Key);
internal sealed record RsaKeyRequest(int KeySize = 2048);
internal sealed record RsaCryptoRequest(string Text, string PublicKey = "", string PrivateKey = "");
internal sealed record RsaInspectRequest(string Key);
internal sealed record CryptoResponse(string Result, string Message);
internal sealed record RsaKeyResponse(string PublicKey, string PrivateKey, string Message);
internal sealed record ErrorResponse(string Error);

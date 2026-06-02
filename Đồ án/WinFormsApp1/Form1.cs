using System.Security.Cryptography;

namespace WinFormsApp1;

public partial class Form1 : Form
{
    public Form1()
    {
        InitializeComponent();
        cboRsaKeySize.SelectedIndex = 1;
    }

    private void btnPlayfairInfo_Click(object sender, EventArgs e)
    {
        ShowPrincipleDialog(
            "Nguyên lý hoạt động PlayFair",
            """
            1. Khóa được chuẩn hóa để tạo ma trận 5x5.

            2. Thuật toán chỉ xử lý chữ cái A-Z và gộp J thành I.

            3. Văn bản được tách thành từng cặp ký tự.
            Nếu hai ký tự trong cùng một cặp bị trùng, hệ thống sẽ chèn ký tự đệm.

            4. Quy tắc mã hóa:
            - Cùng hàng: dịch sang phải.
            - Cùng cột: dịch xuống dưới.
            - Khác hàng, khác cột: lấy hai góc còn lại của hình chữ nhật.

            5. Giải mã là quá trình ngược lại và kết quả trả về là bản rõ đã chuẩn hóa.
            """);
    }

    private void btnRsaInfo_Click(object sender, EventArgs e)
    {
        ShowPrincipleDialog(
            "Nguyên lý hoạt động RSA",
            """
            1. RSA là hệ mã hóa bất đối xứng, dùng một cặp khóa:
            - Khóa công khai để mã hóa.
            - Khóa bí mật để giải mã.

            2. Ứng dụng hỗ trợ tạo khóa theo nhiều độ dài khác nhau.

            3. Luồng mã hóa:
            - Nhập bản rõ.
            - Dùng khóa công khai PEM.
            - Kết quả được xuất ra ở dạng Base64.

            4. Luồng giải mã:
            - Nhập chuỗi Base64 đã mã hóa.
            - Dùng khóa bí mật PEM tương ứng để giải mã.
            - Hệ thống trả về nội dung gốc.

            5. Ứng dụng đang sử dụng OAEP SHA-256 để tăng độ an toàn.
            """);
    }

    private void btnPlayfairEncrypt_Click(object sender, EventArgs e)
    {
        try
        {
            txtPlayfairEncryptOutput.Text = CryptoService.PlayfairEncrypt(
                txtPlayfairEncryptInput.Text,
                txtPlayfairKey.Text);

            lblPlayfairStatus.Text = "PlayFair: đã mã hóa xong. Chỉ xử lý chữ A-Z, bỏ qua số và ký tự đặc biệt.";
        }
        catch (Exception ex)
        {
            ShowError($"Mã hóa PlayFair thất bại. {ex.Message}");
        }
    }

    private void btnPlayfairDecrypt_Click(object sender, EventArgs e)
    {
        try
        {
            txtPlayfairDecryptOutput.Text = CryptoService.PlayfairDecrypt(
                txtPlayfairDecryptInput.Text,
                txtPlayfairKey.Text);

            lblPlayfairStatus.Text = "PlayFair: đã giải mã xong. Kết quả trả về là bản rõ đã chuẩn hóa theo PlayFair.";
        }
        catch (Exception ex)
        {
            ShowError($"Giải mã PlayFair thất bại. {ex.Message}");
        }
    }

    private void btnPlayfairMoveToDecrypt_Click(object sender, EventArgs e)
    {
        txtPlayfairDecryptInput.Text = txtPlayfairEncryptOutput.Text;
        lblPlayfairStatus.Text = "PlayFair: đã chuyển bản mã sang khu vực giải mã.";
    }

    private void btnPlayfairClear_Click(object sender, EventArgs e)
    {
        txtPlayfairKey.Clear();
        txtPlayfairEncryptInput.Clear();
        txtPlayfairEncryptOutput.Clear();
        txtPlayfairDecryptInput.Clear();
        txtPlayfairDecryptOutput.Clear();
        lblPlayfairStatus.Text = "PlayFair: sẵn sàng xử lý.";
    }

    private void btnRsaGenerateKeys_Click(object sender, EventArgs e)
    {
        try
        {
            int keySize = int.Parse(cboRsaKeySize.Text);
            var (pubKey, privKey) = CryptoService.GenerateCustomRsaKeys(keySize);

            txtRsaPublicKey.Text = pubKey;
            txtRsaPrivateKey.Text = privKey;
            lblRsaStatus.Text = $"RSA: đã tạo cặp khóa {keySize}-bit bằng thuật toán thủ công.";
        }
        catch (Exception ex)
        {
            ShowError($"Không thể tạo khóa RSA. {ex.Message}");
        }
    }

    private void btnRsaEncrypt_Click(object sender, EventArgs e)
    {
        try
        {
            txtRsaEncryptOutput.Text = CryptoService.RsaEncrypt(
                txtRsaEncryptInput.Text,
                txtRsaPublicKey.Text);

            lblRsaStatus.Text = "RSA: đã mã hóa xong bằng khóa công khai.";
        }
        catch (Exception ex)
        {
            ShowError($"Mã hóa RSA thất bại. {ex.Message}");
        }
    }

    private void btnRsaDecrypt_Click(object sender, EventArgs e)
    {
        try
        {
            txtRsaDecryptOutput.Text = CryptoService.RsaDecrypt(
                txtRsaDecryptInput.Text,
                txtRsaPrivateKey.Text);

            lblRsaStatus.Text = "RSA: đã giải mã xong bằng khóa bí mật.";
        }
        catch (Exception ex)
        {
            ShowError($"Giải mã RSA thất bại. {ex.Message}");
        }
    }

    private void btnRsaMoveToDecrypt_Click(object sender, EventArgs e)
    {
        txtRsaDecryptInput.Text = txtRsaEncryptOutput.Text;
        lblRsaStatus.Text = "RSA: đã chuyển bản mã sang khu vực giải mã.";
    }

    private void btnRsaClear_Click(object sender, EventArgs e)
    {
        txtRsaPublicKey.Clear();
        txtRsaPrivateKey.Clear();
        txtRsaEncryptInput.Clear();
        txtRsaEncryptOutput.Clear();
        txtRsaDecryptInput.Clear();
        txtRsaDecryptOutput.Clear();
        lblRsaStatus.Text = "RSA: sẵn sàng tạo khóa và xử lý.";
    }

    private void ShowError(string message)
    {
        MessageBox.Show(
            this,
            message,
            "Thông báo",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error);
    }

    private void ShowPrincipleDialog(string title, string content)
    {
        using Form dialog = new()
        {
            Text = title,
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MinimizeBox = false,
            MaximizeBox = false,
            ClientSize = new Size(640, 420),
            BackColor = Color.White
        };

        Label header = new()
        {
            Dock = DockStyle.Top,
            Height = 54,
            Text = title,
            Font = new Font("Segoe UI Semibold", 14F, FontStyle.Bold),
            ForeColor = Color.FromArgb(37, 51, 99),
            Padding = new Padding(16, 12, 16, 0)
        };

        TextBox body = new()
        {
            Dock = DockStyle.Fill,
            Multiline = true,
            ReadOnly = true,
            BorderStyle = BorderStyle.None,
            Font = new Font("Segoe UI", 10.5F),
            BackColor = Color.White,
            ScrollBars = ScrollBars.Vertical,
            Text = content,
            TabStop = false
        };

        Button closeButton = new()
        {
            Text = "Đóng",
            DialogResult = DialogResult.OK,
            Size = new Size(96, 34),
            Location = new Point(528, 12),
            BackColor = Color.FromArgb(237, 240, 248),
            FlatStyle = FlatStyle.Flat
        };
        closeButton.FlatAppearance.BorderColor = Color.FromArgb(199, 206, 223);

        Panel footer = new()
        {
            Dock = DockStyle.Bottom,
            Height = 58
        };
        footer.Controls.Add(closeButton);

        Panel bodyHost = new()
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(16, 6, 16, 16)
        };
        bodyHost.Controls.Add(body);

        dialog.Controls.Add(bodyHost);
        dialog.Controls.Add(footer);
        dialog.Controls.Add(header);
        dialog.AcceptButton = closeButton;

        dialog.ShowDialog(this);
    }
}

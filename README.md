# 🪷 Chùa Vĩnh Tràng Online — 3D Multiplayer (demo)

Game trình duyệt 3D nhẹ, được **lấy cảm hứng** từ kiến trúc chùa Vĩnh Tràng tại Mỹ Tho; không phải mô hình 3D đo đạc chính xác của chùa. Dùng Canvas 3D tự viết để **không cần thư viện ngoài**, chạy trên điện thoại/laptop. Server Node.js sử dụng WebSocket thuần (không cần `npm install` package phụ thuộc).

## Có những gì?

- Sân chùa 3D và chánh điện 3D có thể đi vào/ra.
- Điều khiển cảm ứng bằng joystick (điện thoại), vuốt để xoay; máy tính dùng WASD / phím mũi tên và kéo chuột; E để tương tác.
- Người chơi cùng phòng nhìn thấy vị trí, màu trang phục, tên của nhau (WebSocket) và có thể trò chuyện.
- Âm thanh tiếng chuông, tiếng mõ tổng hợp bằng Web Audio; giọng máy tiếng Việt đọc **đoạn suy ngẫm ngắn do game viết**, không phải bài kinh/pháp thoại gốc của một vị thầy.
- Nếu thêm audio/chant.mp3 và audio/dharma.mp3 có giấy phép vào public/audio/ thì nút **Nghe Phật pháp** sẽ ưu tiên phát bản ghi đó.

## Chạy trên máy tính

Cần Node.js 18+:

```bash
npm start
```

Trên máy tính: mở http://localhost:3000. Để thử trên điện thoại cùng Wi-Fi: tìm IP LAN của máy tính và mở `http://IP-CUA-MAY:3000` (cho phép mạng nội bộ qua firewall nếu bị chặn). Âm thanh cần người chơi bấm vào game để trình duyệt cho phép phát.

## Đưa game lên Internet (mọi người cùng chơi)

1. Đăng nhập GitHub và tạo repository mới. Đẩy **toàn bộ nội dung thư mục này** lên repo (index.html nằm trong public/).
2. Mở https://dashboard.render.com và chọn **New → Web Service**, kết nối repository.
3. Chọn Node, build command `npm install`, start command `npm start` (hoặc sử dụng render.yaml để triển khai Blueprint). Chọn gói phù hợp.
4. Render cấp link HTTPS dạng `https://<ten-game>.onrender.com`. Gửi link đó để mọi người vào chung một server, không cần cài ứng dụng.

> Không triển khai chỉ bằng GitHub Pages / Netlify Drop: đây là game multiplayer nên cần **server Node.js chạy liên tục** hỗ trợ WebSocket. Gói miễn phí có thể ngủ khi không sử dụng và khởi động chậm. Hiện trạng không có cơ sở dữ liệu: khi server khởi động lại thì người đang online sẽ kết nối lại, tin nhắn không được lưu. Có giới hạn 70 kết nối cùng lúc trên mỗi instance. Nếu chạy nhiều instance, cần dùng Redis để chia sẻ trạng thái.

## Âm thanh chân thật

Tải bản ghi **được quyền sử dụng công khai** và đặt vào `public/audio/chant.mp3` (tụng kinh) và `public/audio/dharma.mp3` (bài giảng). Không dùng âm thanh của nhà chùa/người giảng khi chưa được cho phép. Xem `public/audio/README.md`.

## Giới hạn bản thử nghiệm

- Phần kiến trúc 3D thủ công lấy cảm hứng từ các đặc điểm hình thái của chùa Vĩnh Tràng: vòm cửa pha Á–Âu, màu vàng kem, sân cây, cột và gian thờ. Không phải tái dựng khảo cổ chính xác, tượng là mô hình tượng trưng.
- Chưa có avatar animation mượt, bản đồ tối ưu cho quy mô vừa; chưa có hệ thống moderation chuyên nghiệp, đăng nhập, lưu tài khoản hoặc chống gian lận hoàn chỉnh.
- Không quảng cáo game như sản phẩm chính thức của chùa. Dành cho mục đích mô phỏng/tham khảo.

## Cấu trúc

```
server.js             HTTP + WebSocket real-time, không phụ thuộc npm package
package.json          npm start
render.yaml           gợi ý deploy Render
public/index.html     giao diện người dùng, hỗ trợ mobile
public/game.js        engine 3D, điều khiển, âm thanh, multiplayer
public/audio/         cho bản thu có quyền sử dụng
```

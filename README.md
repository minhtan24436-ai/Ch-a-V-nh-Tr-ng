# Chùa Vĩnh Tràng Online — bản 2.0

Bản nâng cấp từ 1.0: thêm nút **↗ mời bạn** trên điện thoại và laptop (dùng Web Share API nếu có, nếu không sao chép liên kết); làm rõ trạng thái bản mô phỏng. Giữ nguyên sân chùa 3D, chánh điện, điều khiển cảm ứng, chat, WebSocket multiplayer, chuông mõ tổng hợp.

**Lưu ý:** Chưa có bản thu tụng kinh thật. Để phát file có quyền sử dụng, thêm `public/audio/chant.mp3` và `public/audio/dharma.mp3`. Chưa phải bản dựng kiến trúc chính xác của chùa Vĩnh Tràng.

## Cập nhật GitHub từ bản cũ

**Cách dễ và an toàn nhất**: cài GitHub Desktop, clone repository đang chạy trên Render, sao chép **nội dung** thư mục này đè lên thư mục repository vừa clone (không chép thư mục `vinh-trang-v2` làm một thư mục con). Trong GitHub Desktop kiểm tra Changes, Commit to main rồi Push origin. Render Auto Deploy sẽ tự cập nhật nếu đã bật.

**Không xóa repository hoặc tạo Render mới.** Giữ nguyên các file `server.js`, `render.yaml`, `public/`, `test/` ở thư mục gốc.

Chạy thử trên máy: `npm start`, mở http://localhost:10000 (hoặc cổng do server thông báo). Kiểm thử: `npm test`.

## Chức năng

- Web trên iPhone, Android, laptop; joystick cảm ứng và xoay camera.
- Hai khu vực sân chùa/chánh điện; đồng bộ người chơi qua WebSocket.
- Chat và nút chia sẻ link để mời người khác vào cùng máy chủ.
- Chuông, mõ tổng hợp; hỗ trợ MP3 tùy chọn có quyền sử dụng.

## Giới hạn

Máy chủ miễn phí có thể ngủ khi không hoạt động. Không có tài khoản, phòng riêng, lưu tiến trình hoặc kiểm duyệt nội dung chat ở mức production. Không dùng nội dung thu âm của bên thứ ba khi chưa được phép.

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    id: 'general-terms',
    titleVi: 'Điều khoản chung',
    titleEn: 'General Terms',
    contentVi: `Chào mừng quý khách đến với Tuấn Đạt Luxury Hotel. Khi sử dụng dịch vụ của chúng tôi, quý khách đồng ý tuân thủ các điều khoản và điều kiện sau đây.\n\nKhách sạn có quyền từ chối phục vụ nếu khách hàng vi phạm quy định nội bộ hoặc pháp luật Việt Nam. Mọi thông tin đặt phòng cần chính xác và trung thực.`,
    contentEn: `Welcome to Tuấn Đạt Luxury Hotel. By using our services, you agree to comply with the following terms and conditions.\n\nThe hotel reserves the right to refuse service if guests violate internal regulations or Vietnamese law. All booking information must be accurate and truthful.`,
  },
  {
    id: 'general-rules',
    titleVi: 'Quy định chung',
    titleEn: 'General Rules',
    contentVi: `• Giờ nhận phòng (check-in): 14:00\n• Giờ trả phòng (check-out): 12:00\n• Không hút thuốc trong phòng\n• Giữ trật tự sau 22:00\n• Không mang vật nuôi\n• Không sử dụng chất cấm trong khuôn viên khách sạn\n• Khách có trách nhiệm bảo quản tài sản trong phòng`,
    contentEn: `• Check-in time: 14:00\n• Check-out time: 12:00\n• No smoking in rooms\n• Quiet hours after 22:00\n• No pets allowed\n• No prohibited substances on hotel premises\n• Guests are responsible for safekeeping room property`,
  },
  {
    id: 'payment',
    titleVi: 'Quy định thanh toán',
    titleEn: 'Payment Policy',
    contentVi: `• Đặt cọc tối thiểu 50% tổng giá trị đơn đặt phòng\n• Thanh toán phần còn lại khi nhận phòng\n• Chấp nhận: chuyển khoản ngân hàng, tiền mặt\n• Hóa đơn VAT được cung cấp khi có yêu cầu\n• Giá phòng có thể thay đổi theo mùa và ngày lễ`,
    contentEn: `• Minimum deposit: 50% of total booking value\n• Remaining balance due at check-in\n• Accepted: bank transfer, cash\n• VAT invoice provided upon request\n• Room rates may vary by season and holidays`,
  },
  {
    id: 'booking-confirm',
    titleVi: 'Xác nhận đặt phòng',
    titleEn: 'Booking Confirmation',
    contentVi: `• Đặt phòng được xác nhận sau khi nhận đủ tiền cọc\n• Email xác nhận sẽ được gửi trong vòng 24 giờ\n• Hủy trước 48h: hoàn 100% tiền cọc\n• Hủy trong 24–48h: hoàn 50% tiền cọc\n• Hủy dưới 24h hoặc không đến: không hoàn cọc\n• Thay đổi ngày: liên hệ trước 48h`,
    contentEn: `• Booking confirmed after deposit received\n• Confirmation email sent within 24 hours\n• Cancel 48h+ before: 100% refund\n• Cancel 24–48h before: 50% refund\n• Cancel <24h or no-show: no refund\n• Date changes: contact 48h in advance`,
  },
  {
    id: 'disputes',
    titleVi: 'Giải quyết tranh chấp',
    titleEn: 'Dispute Resolution',
    contentVi: `Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng trực tiếp giữa khách hàng và khách sạn. Trong trường hợp không thể thỏa thuận, tranh chấp sẽ được giải quyết tại cơ quan có thẩm quyền theo quy định pháp luật Việt Nam.`,
    contentEn: `All disputes will be resolved through direct negotiation between the guest and the hotel. If no agreement can be reached, disputes will be settled by competent authorities under Vietnamese law.`,
  },
  {
    id: 'privacy',
    titleVi: 'Bảo vệ dữ liệu cá nhân',
    titleEn: 'Personal Data Protection',
    contentVi: `Chúng tôi cam kết bảo vệ thông tin cá nhân của quý khách. Dữ liệu chỉ được sử dụng cho mục đích đặt phòng và cải thiện dịch vụ. Không chia sẻ cho bên thứ ba trừ khi có yêu cầu từ cơ quan pháp luật.`,
    contentEn: `We are committed to protecting your personal information. Data is only used for booking purposes and service improvement. No sharing with third parties unless required by law.`,
  },
  {
    id: 'transparency',
    titleVi: 'Minh bạch',
    titleEn: 'Transparency',
    contentVi: `Khách sạn cam kết minh bạch trong giá cả, chất lượng dịch vụ và chính sách hoạt động. Mọi thay đổi về giá và chính sách sẽ được thông báo công khai trên website.`,
    contentEn: `The hotel commits to transparency in pricing, service quality, and operational policies. All changes to prices and policies will be publicly announced on the website.`,
  },
  {
    id: 'stakeholders',
    titleVi: 'Quan hệ cổ đông',
    titleEn: 'Stakeholder Relations',
    contentVi: `Thông tin dành cho đối tác và cổ đông. Vui lòng liên hệ trực tiếp qua email tuandatluxuryflc36hotel@gmail.com hoặc hotline 098.360.5768 để biết thêm chi tiết.`,
    contentEn: `Information for partners and stakeholders. Please contact directly via email tuandatluxuryflc36hotel@gmail.com or hotline 098.360.5768 for more details.`,
  },
];

const Terms = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const current = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Điều khoản & Quy định' : 'Terms & Policies'}
          </h1>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            {/* Sidebar */}
            <nav className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-28 space-y-1 bg-card rounded-xl border border-border p-3">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      activeSection === s.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {isVi ? s.titleVi : s.titleEn}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 bg-card rounded-xl border border-border p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
                {isVi ? current.titleVi : current.titleEn}
              </h2>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {isVi ? current.contentVi : current.contentEn}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;

import OpenAI from 'openai';
import type { Place, SuggestRequest, ItineraryRequest, ItineraryDay } from '../types/index.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// The model occasionally glues a generic dining/shopping descriptor onto an
// otherwise-real place name despite the prompt forbidding it (e.g. "Khu phố ẩm
// thực Quận 7" instead of "Quận 7"). Strip the known glued-on patterns so the
// underlying real place name survives — this can't fix a name that's entirely
// invented (a dish or a fictional restaurant), only recover the real name when
// the model wrapped one in an unwanted qualifier.
const GENERIC_DINING_PREFIX = /^(khu\s+phố\s+ẩm\s+thực|khu\s+ẩm\s+thực|phố\s+ẩm\s+thực|góc\s+phố\s+ẩm\s+thực|góc\s+ẩm\s+thực)\s+/i;
const REDUNDANT_KHU_PREFIX = /^khu\s+(?=phố\s)/i;
const GENERIC_ENGLISH_SUFFIX = /\s+(market\s+food\s+court|food\s+court|market)$/i;

export function cleanPlaceName(name: string): string {
  let cleaned = name.trim();
  cleaned = cleaned.replace(GENERIC_DINING_PREFIX, '');
  cleaned = cleaned.replace(REDUNDANT_KHU_PREFIX, '');
  cleaned = cleaned.replace(GENERIC_ENGLISH_SUFFIX, '');
  cleaned = cleaned.trim();
  if (cleaned && cleaned[0] !== cleaned[0].toUpperCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  return cleaned || name;
}

const suggestSchema = {
  type: 'object',
  properties: {
    places: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: {
            type: 'string',
            description:
              "Tên riêng CHÍNH THỨC, NGUYÊN VĂN của MỘT địa danh có thật, đủ nổi tiếng để tra cứu được trên bản đồ hoặc Wikipedia (thành phố, đảo, bãi biển, chợ, phố đi bộ, khu phố nổi tiếng, di tích...), viết bằng tiếng Việt có dấu đầy đủ, đúng chính tả. KHÔNG được ghép thêm bất kỳ cụm mô tả loại hình nào vào trước/sau tên địa danh, dù tên gốc có thật (vd sai: 'Khu phố ẩm thực Quận 7', 'Khu ẩm thực Chợ Lớn', 'Góc Phố Ẩm Thực Vĩnh Khánh', 'Bến Thành Market Food Court' — phải dùng đúng 'Quận 7', 'Chợ Lớn', 'Đường Vĩnh Khánh', 'Chợ Bến Thành'). Ví dụ đúng: 'Đà Lạt', 'Vịnh Hạ Long', 'Phú Quốc', 'Chợ Bến Thành', 'Phố đi bộ Nguyễn Huệ', 'Phố Tây Bùi Viện'. Ví dụ sai — KHÔNG được dùng: 'Da Lat', 'Ha Long Bay' (thiếu dấu); tên món ăn như 'Bún Bò Huế', 'Bánh Mì Huỳnh Hoa' (không phải địa danh); tên một nhà hàng/quán ăn/cửa hàng cụ thể như 'Lẩu Dê Ninh Khương', 'Bún Chả Hương Liên' (không phải địa danh, không tra cứu được); một khái niệm khu vực tự đặt ra không chính thức như 'Quận 1 - Khu Đông Kinh Nghệ Thuật' (không phải tên có thật).",
          },
          region: { type: 'string' },
          country: { type: 'string', enum: ['Việt Nam'] },
          reason: { type: 'string' },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              description:
                "Từ khoá ngắn mô tả đặc điểm địa điểm, viết bằng tiếng Việt có dấu đầy đủ (vd: 'biển', 'núi', 'lãng mạn', 'gia đình'). Không dùng tiếng Anh.",
            },
          },
          imageQuery: {
            type: 'string',
            description:
              "Tên địa danh viết bằng tiếng Anh, dạng slug chữ thường, các từ nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền. Ví dụ đúng: 'da-lat', 'ha-long-bay', 'phu-quoc'. Ví dụ sai: 'Đà Lạt', 'HaLongBay'.",
          },
        },
        required: ['id', 'name', 'region', 'country', 'reason', 'tags', 'imageQuery'],
        additionalProperties: false,
      },
    },
  },
  required: ['places'],
  additionalProperties: false,
};

export async function getSuggestions(req: SuggestRequest): Promise<Place[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ. QUY TẮC BẮT BUỘC cho tên địa điểm: phải là tên riêng CHÍNH THỨC, NGUYÊN VĂN của một nơi có thật, tra cứu được trên bản đồ hoặc Wikipedia — TUYỆT ĐỐI KHÔNG được ghép thêm cụm mô tả loại hình vào trước/sau tên đó, dù tên gốc có thật (sai: "Khu phố ẩm thực Quận 7", "Khu ẩm thực Chợ Lớn", "Góc Phố Ẩm Thực Vĩnh Khánh", "Bến Thành Market Food Court" → phải dùng đúng "Quận 7", "Chợ Lớn", "Đường Vĩnh Khánh", "Chợ Bến Thành"); KHÔNG được dùng tên món ăn (sai: "Bún Bò Huế", "Bánh Mì Huỳnh Hoa"); KHÔNG được bịa tên nhà hàng/quán ăn cụ thể (sai: "Lẩu Dê Ninh Khương"); KHÔNG được tự đặt khái niệm khu vực không chính thức (sai: "Quận 1 - Khu Đông Kinh Nghệ Thuật"). Nếu muốn gợi ý trải nghiệm ẩm thực/mua sắm, hãy dùng ĐÚNG tên chợ/phố đi bộ/khu phố CÓ THẬT, không thêm mô tả (vd: "Chợ Bến Thành", "Phố đi bộ Nguyễn Huệ", "Phố Tây Bùi Viện", "Chợ Lớn"). Trước khi trả lời, tự rà lại từng tên: nếu không chắc chắn tên đó tồn tại nguyên văn trên bản đồ hoặc Wikipedia, hãy đổi sang một địa danh có thật khác. Toàn bộ 6 địa điểm BẮT BUỘC nằm trong lãnh thổ Việt Nam — tuyệt đối không gợi ý địa điểm ở nước khác, kể cả khi yêu cầu của người dùng gợi liên tưởng đến phong cách du lịch nước ngoài (vd "biển đẹp như Bali", "giống Santorini"); trong trường hợp đó vẫn chọn địa điểm trong nước có đặc điểm tương tự. Trường country của mọi địa điểm luôn là "Việt Nam". Trường name và mọi phần tử trong tags BẮT BUỘC viết bằng tiếng Việt có dấu đầy đủ, đúng chính tả — tuyệt đối không được bỏ dấu, không được dùng tiếng Anh. Riêng trường imageQuery của mỗi địa điểm là NGOẠI LỆ DUY NHẤT: BẮT BUỘC là tên địa danh viết bằng tiếng Anh, dạng slug chữ thường nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền (vd: "da-lat", "ha-long-bay", "phu-quoc") — dùng để tra cứu ảnh trên Wikipedia, tuyệt đối không được để nguyên tiếng Việt hay viết dính liền kiểu PascalCase.',
      },
      { role: 'user', content: JSON.stringify(req) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'suggestions', strict: true, schema: suggestSchema },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về nội dung rỗng');

  const parsed = JSON.parse(content) as { places: Place[] };
  if (parsed.places.length !== 6) {
    throw new Error(`Kỳ vọng 6 địa điểm, nhận được ${parsed.places.length}`);
  }
  return parsed.places.map((place) => ({ ...place, name: cleanPlaceName(place.name) }));
}

function buildItinerarySchema(days: number) {
  const slot = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      imageQuery: { type: 'string' },
    },
    required: ['name', 'description', 'imageQuery'],
    additionalProperties: false,
  };

  return {
    type: 'object',
    properties: {
      days: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            slots: {
              type: 'object',
              properties: { morning: slot, noon: slot, afternoon: slot, evening: slot },
              required: ['morning', 'noon', 'afternoon', 'evening'],
              additionalProperties: false,
            },
          },
          required: ['date', 'slots'],
          additionalProperties: false,
        },
      },
    },
    required: ['days'],
    additionalProperties: false,
  };
}

export async function getItinerary(req: ItineraryRequest): Promise<ItineraryDay[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là chuyên gia lên lịch trình du lịch. Sinh lịch trình chi tiết đúng số ngày yêu cầu, mỗi ngày đúng 4 khung giờ Sáng/Trưa/Chiều/Tối, mỗi khung giờ là một địa điểm cụ thể trong khu vực đã chọn.',
      },
      { role: 'user', content: JSON.stringify(req) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'itinerary', strict: true, schema: buildItinerarySchema(req.days) },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về nội dung rỗng');

  const parsed = JSON.parse(content) as { days: ItineraryDay[] };
  if (parsed.days.length !== req.days) {
    throw new Error(`Kỳ vọng ${req.days} ngày, nhận được ${parsed.days.length}`);
  }
  return parsed.days;
}

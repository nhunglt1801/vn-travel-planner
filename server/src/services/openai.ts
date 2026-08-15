import OpenAI from 'openai';
import type { Place, SuggestRequest } from '../types/index.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
              "Tên MỘT địa danh du lịch có thật, nổi tiếng, được nhiều người biết đến và có thể tra cứu được (thành phố, đảo, bãi biển, chợ, phố đi bộ, khu phố nổi tiếng, di tích...), viết bằng tiếng Việt có dấu đầy đủ, đúng chính tả. Ví dụ đúng: 'Đà Lạt', 'Vịnh Hạ Long', 'Phú Quốc', 'Chợ Bến Thành', 'Phố đi bộ Nguyễn Huệ', 'Phố Tây Bùi Viện'. Ví dụ sai — KHÔNG được dùng: 'Da Lat', 'Ha Long Bay' (thiếu dấu); tên một nhà hàng/quán ăn/cửa hàng cụ thể như 'Lẩu Dê Ninh Khương', 'Bún Chả Hương Liên' (không phải địa danh, không tra cứu được); một khái niệm khu vực tự đặt ra không chính thức như 'Quận 1 - Khu Đông Kinh Nghệ Thuật' (không phải tên có thật).",
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
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ. Mỗi địa điểm BẮT BUỘC là một địa danh có thật, nổi tiếng, có thể tra cứu được — tuyệt đối KHÔNG được bịa ra tên nhà hàng/quán ăn cụ thể, cũng KHÔNG được tự đặt ra khái niệm khu vực không chính thức (vd sai: "Lẩu Dê Ninh Khương", "Quận 1 - Khu Đông Kinh Nghệ Thuật"); nếu muốn gợi ý trải nghiệm ẩm thực/mua sắm, hãy dùng tên chợ/phố đi bộ/khu phố có thật và nổi tiếng thay thế (vd: "Chợ Bến Thành", "Phố đi bộ Nguyễn Huệ", "Phố Tây Bùi Viện", "Chợ Lớn"). Toàn bộ 6 địa điểm BẮT BUỘC nằm trong lãnh thổ Việt Nam — tuyệt đối không gợi ý địa điểm ở nước khác, kể cả khi yêu cầu của người dùng gợi liên tưởng đến phong cách du lịch nước ngoài (vd "biển đẹp như Bali", "giống Santorini"); trong trường hợp đó vẫn chọn địa điểm trong nước có đặc điểm tương tự. Trường country của mọi địa điểm luôn là "Việt Nam". Trường name và mọi phần tử trong tags BẮT BUỘC viết bằng tiếng Việt có dấu đầy đủ, đúng chính tả — tuyệt đối không được bỏ dấu, không được dùng tiếng Anh. Riêng trường imageQuery của mỗi địa điểm là NGOẠI LỆ DUY NHẤT: BẮT BUỘC là tên địa danh viết bằng tiếng Anh, dạng slug chữ thường nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền (vd: "da-lat", "ha-long-bay", "phu-quoc") — dùng để tra cứu ảnh trên Wikipedia, tuyệt đối không được để nguyên tiếng Việt hay viết dính liền kiểu PascalCase.',
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
  return parsed.places;
}

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
          name: { type: 'string' },
          region: { type: 'string' },
          country: { type: 'string' },
          reason: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
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
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ. Toàn bộ 6 địa điểm BẮT BUỘC nằm trong lãnh thổ Việt Nam — tuyệt đối không gợi ý địa điểm ở nước khác, kể cả khi yêu cầu của người dùng gợi liên tưởng đến phong cách du lịch nước ngoài (vd "biển đẹp như Bali", "giống Santorini"); trong trường hợp đó vẫn chọn địa điểm trong nước có đặc điểm tương tự. Trường country của mọi địa điểm luôn là "Việt Nam". Trường imageQuery của mỗi địa điểm BẮT BUỘC là tên địa danh viết bằng tiếng Anh, dạng slug chữ thường nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền (vd: "da-lat", "ha-long-bay", "phu-quoc") — dùng để tra cứu ảnh trên Wikipedia, tuyệt đối không được để nguyên tiếng Việt hay viết dính liền kiểu PascalCase.',
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

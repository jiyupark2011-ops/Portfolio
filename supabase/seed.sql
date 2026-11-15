-- 박지유 포트폴리오 — 초기 데이터
-- 001_init.sql 실행 후 SQL Editor에서 실행하세요. 여러 번 실행해도 중복되지 않습니다.

insert into public.profile (id, name, age_label, keywords)
values (1, '박지유', '15세', array['도전','끈기'])
on conflict (id) do nothing;

insert into public.sections (key, eyebrow, title, sort_order) values
  ('awards',       'AWARDS',       '수상 경력',     10),
  ('certificates', 'CERTIFICATES', '자격증',        20),
  ('skills',       'SKILLS',       '보유 기술',     30),
  ('works',        'PROJECTS',     '작품',          40),
  ('clubs',        'CLUBS',        '동아리 활동',   50),
  ('volunteer',    'VOLUNTEER',    '봉사활동',      60),
  ('interests',    'INTERESTS',    '관심사 · 취미', 70)
on conflict (key) do nothing;

insert into public.items (section_key, title, badge, sort_order)
select v.section_key, v.title, v.badge, v.sort_order
from (values
  ('awards',       '제3회 학교안전사고 데이터 분석 활용 경진대회',               '대상',      10),
  ('awards',       '2026 SONGDO 3s',                                              '3rd place', 20),
  ('awards',       '2026 Little Ambassador 선발 공모전',                          '최우수상',  30),
  ('awards',       '2026 제8회 전국 학생 AI 경진대회 · 교과연계 AI 탐구 부문',    '장려상',    40),
  ('certificates', '한자능력검정시험',                                            '5급',       10),
  ('clubs',        'g2f',                                                         '',          10),
  ('clubs',        '농구부',                                                      '',          20),
  ('clubs',        '밴드',                                                        '',          30),
  ('volunteer',    'g2f',                                                         '',          10)
) as v(section_key, title, badge, sort_order)
where not exists (select 1 from public.items);

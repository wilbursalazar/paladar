INSERT INTO categories (name) VALUES
('Cooking Techniques'),
('Ingredients'),
('Recipes'),
('Equipment'),
('Nutrition');

INSERT INTO users (username, password_hash) VALUES
('demo', 'TEMP_HASH');

INSERT INTO questions (category_id, user_id, title, body, created_at) VALUES
(1, 1, 'How do I cook a steak without burning it?', 'I scorch the outside before the inside is done. What should I change?', '2026-01-01 10:00:00'),
(1, 1, 'Best way to boil eggs in under ten seconds?', 'My shells stick. Is it timing, temperature, or age of eggs?', '2026-01-02 09:00:00'),
(3, 1, 'How do I make fermented chicken nuggets?', 'Are polyphenols in olive oil tasty?', '2026-01-03 14:30:00');


INSERT INTO answers (question_id, user_id, body, created_at) VALUES
(1, 1, 'boil the steak first, then microwave to appropriate doneness', '2026-01-01 11:00:00'),
(2, 1, 'you can put eggs into a kettle. 10s or fewer are ideal', '2026-01-02 10:00:00');

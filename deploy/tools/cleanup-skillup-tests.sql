-- Remove accounts left over from API verification runs.
-- Mirrors what DELETE /api/skillup/account does, so the database ends up
-- in exactly the state that endpoint would leave it in.

CREATE TEMPORARY TABLE tmp_test_ids AS
  SELECT id FROM users
  WHERE email LIKE 'skillup.test.%'
     OR email LIKE 'skillup.empty.%'
     OR email LIKE 'diag.%'
     OR email LIKE 'shape%'
     OR email LIKE 'weak.%'
     OR email LIKE 'mm.%';

DELETE FROM favorites WHERE user_id IN (SELECT id FROM tmp_test_ids);
DELETE FROM bookings  WHERE user_id IN (SELECT id FROM tmp_test_ids);

DELETE oi FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.user_id IN (SELECT id FROM tmp_test_ids);
DELETE FROM orders WHERE user_id IN (SELECT id FROM tmp_test_ids);

-- repair requests, trade-ins and reviews stay as store history but lose the link
UPDATE repair_requests SET user_id = NULL WHERE user_id IN (SELECT id FROM tmp_test_ids);
UPDATE trade_ins       SET user_id = NULL WHERE user_id IN (SELECT id FROM tmp_test_ids);
UPDATE reviews         SET user_id = NULL WHERE user_id IN (SELECT id FROM tmp_test_ids);

DELETE FROM personal_access_tokens
  WHERE tokenable_type LIKE '%User'
    AND tokenable_id IN (SELECT id FROM tmp_test_ids);
DELETE FROM sessions WHERE user_id IN (SELECT id FROM tmp_test_ids);

DELETE FROM users WHERE id IN (SELECT id FROM tmp_test_ids);
DROP TEMPORARY TABLE tmp_test_ids;

SELECT COUNT(*) AS users_left FROM users;
SELECT COUNT(*) AS progress_rows FROM skillup_progress;
SELECT COUNT(*) AS orphans FROM skillup_progress p
  LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL;
SELECT id, email FROM users
  WHERE email LIKE 'skillup.test%' OR email LIKE 'diag.%' OR email LIKE 'skillup.empty%';

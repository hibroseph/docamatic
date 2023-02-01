select * from basic_metrics;

select distinct date_trunc('day',  date_occurred) as day, count(distinct person) as daily_users 
from basic_metrics 
group by date_trunc('day', date_occurred)
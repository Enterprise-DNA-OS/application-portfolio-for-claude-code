insert into portfolio.applications(id,reference,name,owner,capability,lifecycle,annual_cost,currency,support_end,renewal_on,review_due,reviewed_on,personal_data) values
 ('10000000-0000-0000-0000-000000000001','APP-01','Harbour orders','Aroha','Order management','active',18000,'NZD',current_date-15,current_date+20,current_date-10,current_date-100,true),
 ('10000000-0000-0000-0000-000000000002','APP-02','Harbour dispatch','Ben','Dispatch','active',9600,'NZD',current_date+365,current_date+60,current_date+30,current_date-5,true),
 ('10000000-0000-0000-0000-000000000003','APP-03','Legacy orders','','Order management','retiring',6000,'AUD',current_date+20,current_date-5,null,null,true),
 ('10000000-0000-0000-0000-000000000004','APP-04','Supplier portal','Aroha','Procurement','active',null,null,null,null,current_date-2,current_date-95,false),
 ('10000000-0000-0000-0000-000000000005','APP-05','Analytics archive','Chen','Reporting','retired',2400,'NZD',current_date-180,null,current_date-30,current_date-180,true)
 on conflict(id) do nothing;
insert into portfolio.dependencies(id,consumer_id,provider_id,kind,critical,verified_on,evidence) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','order feed',true,current_date-120,'demo://integration/orders'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','dispatch status',true,current_date-5,'demo://integration/status'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','legacy lookup',false,current_date-100,'demo://integration/legacy')
 on conflict(id) do nothing;
insert into portfolio.controls(id,application_id,kind,evidence,reviewed_on,review_due,actor) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','security','demo://security/orders',current_date-100,current_date-10,'Aroha'),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','security','demo://security/dispatch',current_date-5,current_date+85,'Ben'),
 ('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','retention','demo://retention/dispatch',current_date-5,current_date+85,'Ben')
 on conflict(id) do nothing;
insert into portfolio.decisions(id,application_id,action,rationale,evidence,due_on,application_version,actor) values
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','retire','Review legacy lookup consumers first','demo://decision/legacy',current_date-3,1,'Aroha')
 on conflict(id) do nothing;
insert into portfolio.activity(id,application_id,actor,action,detail,created_at) values
 ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Aroha','note','{"note":"Fictional support notice received"}',now()-interval '100 days')
 on conflict(id) do nothing;

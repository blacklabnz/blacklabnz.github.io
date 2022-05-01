---
title: "Databrick row and column level security"
date: 2022-04-30T23:39:13+13:00
draft: false
tags: ["databricks", "delta-lake", "row level security", "column level security"]
categories: ["databricks", "security"]
author: "Neil Xu"
ShowToc: true
---
Recently I had a chat with one of client regarding on access control of their reports and dashboards. Interestingly it was found out that client is currently doing this by creating similar reports and granting access to people in different security groups. Obviously this is not the best idea because of redundant reports, the ideal solution is to implement row and column level security on the table so that people in different access groups will have visibility to subsets of the rows in the table or view.
Since I a big fan of Databricks, so in this lab lets explore row and column level security implementation and find out how easily it is done in Databricks.
## Table setup
First lets pretend that we are data engineering some sensitive data, say, salary information in a company. Time to populate some data for our lab. 
Before doing this, of course, you will need to create interactive cluster so that all the compute would run on it. To find out more on how to create a cluster, please visit [here](https://docs.databricks.com/clusters/create.html).
Lets create the salary table:
```sql
CREATE TABLE test.salary (
  id INT,
  firstName STRING,
  lastName STRING,
  gender STRING,
  position STRING,
  location STRING,
  salary INT,
  viewable_by STRING
) USING DELTA
```
Now populate some data in it:
```sql
INSERT INTO test.salary VALUES
  (1, 'Billy', 'Tommie', 'M', 'staff', 'NZ', 55250, 'manager'),
  (2, 'Judie', 'Williams', 'F', 'manager', 'NZ', 65250, 'snrmgmt'),
  (3, 'Tom', 'Cruise', 'M', 'staff', 'USA', 75250, 'manager'),
  (4, 'May', 'Thompson', 'F', 'manager', 'USA', 85250, 'snrmgmt'),
  (5, 'David', 'Wang', 'M', 'staff', 'AUSSIE', 95250, 'manager'),
  (6, 'Sammie', 'Willies', 'F', 'staff', 'AUSSIE', 105250, 'manager'),
  (7, 'Jianguo', 'Liu', 'M', 'staff', 'CHINA', 115250, 'manager'),
  (8, 'li', 'Wu', 'F', 'cto', 'CHINA', 125250, 'finance')
```
With the data in place, let dive into it!
## Row level security in Databricks
The key function in Databricks to achieve this is "is_member()". How does it work ? The is_member("group_name") function takes string parameter as the group name, check if the current user belongs to it and then return true of false accordingly. for example
```sql
SELECT is_member('super_group') as group
```
This query will check if the current user is a member of "super_group" and without and access grants, this will return false. 
![ismemeber]({{< get_image_link image_name="ismember.png" >}})
We will use this property to achieve row-level security, please follow along!

Lets create some groups first. One of the column in the data we populated is the "viewable_by", this is to tell Databricks this row is visible to members in this group, so lets go to databricks access control and create them.
To find out more on how to create group in Databricks, please refer to [this](https://docs.databricks.com/administration-guide/users-groups/groups.html).
![groups]({{< get_image_link image_name="groups.png" >}})

## Column level security in Databricks
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

### Create groups
One of the column in the data we populated is the "viewable_by", the value in this column is used to instruct Databricks the row is visible to members in this group, so lets go to databricks access control and create them.
To find out more on how to create group in Databricks, please refer to [this](https://docs.databricks.com/administration-guide/users-groups/groups.html).
![groups]({{< get_image_link image_name="groups.png" >}})

### Update the query with is_member() function
Let update out select query in the way that when our user is assigned to one of the groups created previously, the result set is filtered accordingly.
```sql
SELECT 
*
FROM employee.salary s
WHERE is_member(viewable_by)
```
#### Quick explanation
The is_member function is used to evaluate if the user is member of the group whose name equals to the value in the "viewable_by" column. Therefore if we did not assign the user to any group then no result will show in the result set. 

Lets validate if that is the case by running the query.
![query1]({{< get_image_link image_name="query1.png" >}})
Sweet! As expected no result returned.

Let add our current user account to "manager" group and see if we can filter all the results that "viewable_by" value is manager.
![query2]({{< get_image_link image_name="query2.png" >}})
Voilà! we can see all the records that viewable by manager, works as a charm! 
The "is_member()" function also works with role inheritance and composition. So lets do the following:
1. remove user from "manager" group. 
2. add our current user to "snrmgmt" and the add "snrmgmt" to "manager" group.

We should be see record with "viewable_by" value of "snrmgmt", "manager", "finance". So lets find it out.
![query3]({{< get_image_link image_name="query3.png" >}})
Perfect! Again no unwanted surprises what so ever !

### Visualize in PowerBI
Let create view for PowerBI with "is_member()" so that when PowerBI connects it would evaluate the user membership in databricks.
Both databricks and PowerBI could use the same Azure Ad account, therefore what works in databrick should work for PowerBI as long as we connect it to the right view.
```sql
CREATE or replace VIEW employee.staff_salary_view AS
SELECT 
*
FROM employee.salary s
WHERE is_member(viewable_by)
```
Now create the dataset in PowerBi desktop, and you can find the value for "Server Hostname" and "SQL path" in the "JDBC/ODBC" tab under the "Advanced Options" of your cluster settings.
![powerbi]({{< get_image_link image_name="powerbi.png" >}})
After authenticate with your Azure account and everything was done correctly, we should be able to see the view we just created.
![powerbi2]({{< get_image_link image_name="powerbi2.png" >}})
Lets also drop our user account from the finance group just to re-confirm that the row level security is implemented.
We should be able to see the following simple table visuals that we could still see records viewable by "manager" and "snrmgmt"
![powerbi3]({{< get_image_link image_name="powerbi3.png" >}})
Pretty straight forward isnt it ? All the complexity of achieving this in corporate environment lies in design of RBAC structure and the databricks implementation is just adding is_member() to your view!

## Column level security in Databricks
With lab success of row level security, lets move on to column level security. Basically it is the same concept, only different is that the location of is_member() function is on the column instead of row using where statement.
Remember previously we remove our user from the finance group right ? So lets use this as the filtering condition to hide the salary column.
```sql
SELECT
firstName,
position, 
CASE WHEN
  is_member('finance') THEN salary
  ELSE 'REDACTED'
END AS salary,
viewable_by
FROM employee.salary
```
Run this query and we will see now the salary column is redacted from the our current use as it is no long a member of the finance group.
![query4]({{< get_image_link image_name="query4.png" >}})
Similarly, if we create a view from this query, we would be able to see similar outcome in PowerBI as the previous step.

At this point our lab has reached the end, hope you enjoyed the exercise of security your delta tables in databricks.

If like the content please leave your comments below, if you find issues with the content, please also comment below. Thanks for your time and patience with me !! 
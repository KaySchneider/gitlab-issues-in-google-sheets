# Gitlab Issues on Google Sheets

The Gitlab API is very powerful and allows easy integration with other tools. There are two different ways to query issues, both of which I would like to support. One way is to look at the issues of a project and the other way is to query all issues from a group. The latter is very handy if you have multiple projects (e.g. app and server) in separate repositories, but manage them via shared milestones.

Accordingly I created two functions. The two are quite similar in behavior:

```
=gitlabProjectIssues(PROJECT_ID, QUERY, FIELDS)
=gitlabGroupIssues(GROUP_ID, QUERY, FIELDS)
```


Find the full blogpost here:
https://tobias-sell.com/en/show-and-analyse-gitlab-issues-in-google-sheets/
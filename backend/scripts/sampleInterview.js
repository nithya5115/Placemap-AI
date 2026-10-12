// ALL SAMPLE CONTENT: [type, role, question, keywords]
const I = [
['technical','general','Explain the four pillars of object-oriented programming with examples.',['encapsulation','inheritance','polymorphism','abstraction']],
['technical','java developer','What is the difference between an ArrayList and a LinkedList in Java?',['index','node','insert','memory','access']],
['technical','general','What is a primary key and how is it different from a foreign key?',['unique','null','reference','table','relationship']],
['technical','general','Explain the difference between a process and a thread.',['memory','resource','lightweight','context','shared']],
['technical','general','What is normalization and why is it used?',['redundancy','anomaly','normal form','table','dependency']],
['technical','java developer','How does a HashMap work internally?',['hash','bucket','collision','key','equals']],
['technical','web developer','What is REST and what are the common HTTP methods?',['get','post','put','delete','stateless']],
['technical','general','Explain the time complexity of binary search and when you can use it.',['sorted','log','half','array']],
['hr','general','Tell me about yourself.',['education','skills','project','goal','interest']],
['hr','general','Why do you want to join our company?',['company','growth','skills','contribute','learn']],
['hr','general','What are your strengths and weaknesses?',['strength','weakness','improve','example']],
['hr','general','Where do you see yourself in five years?',['grow','goal','skills','contribute','learn']],
['hr','general','Why should we hire you?',['skills','project','learn','contribute','team']],
['hr','general','Are you willing to relocate or work in shifts?',['flexible','willing','learn','open']],
['behavioral','general','Describe a challenging project you worked on and how you overcame obstacles.',['challenge','solution','team','result']],
['behavioral','general','Tell me about a time you had a conflict with a teammate.',['listen','communicate','resolve','team','outcome']],
['behavioral','general','Describe a time you failed. What did you learn?',['mistake','learned','improve','next']],
['behavioral','general','Tell me about a time you led a team or took initiative.',['lead','initiative','plan','team','result']],
['behavioral','general','Describe a time you had to learn something quickly.',['learn','time','resource','applied','result']],
['behavioral','general','How do you handle tight deadlines?',['prioritize','plan','communicate','deadline','time']],
];
export const interviewSamples = I.map(([type, role, text, keywords]) => ({ type, role, text, keywords, difficulty: 'easy', isSample: true }));

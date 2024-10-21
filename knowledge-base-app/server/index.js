const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect('mongodb+srv://devmodi910:xfEWgGWdk5mlS4nm@cluster0.e4pkf.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });


const SearchResultSchema = new mongoose.Schema({
    query: String,
    results: Array,
    date: { type: Date, default: Date.now }
});
const SearchResult = mongoose.model('SearchResult', SearchResultSchema);


const containsKeywords = (text, keywords) => {
    return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
};


app.get('/search', async (req, res) => {
    const query = req.query.q;
    const keywords = query.split(" ");  
    const primaryKeyword = keywords[0];
    const secondaryKeywords = keywords.slice(1); 

   
    const cachedResult = await SearchResult.findOne({ query });
    if (cachedResult) {
        return res.json(cachedResult.results);
    }

    try {
        
        const stackOverflowResponse = await axios.get(`https://api.stackexchange.com/2.2/search?order=desc&sort=activity&intitle=${primaryKeyword}&site=stackoverflow&pagesize=30`);
        const redditResponse = await axios.get(`https://www.reddit.com/search.json?q=${primaryKeyword}&sort=relevance&limit=30`);

        
        const stackOverflowData = stackOverflowResponse.data.items
            .filter(item => containsKeywords([item.title, item.body || ""], [primaryKeyword]) || containsKeywords([item.title, item.body || ""], secondaryKeywords))  // Include both primary and secondary search
            .map(item => ({
                title: item.title,
                link: item.link,
                score: item.score,
                answers: item.answer_count,
                creation_date: new Date(item.creation_date * 1000)  
            }));

        
        const redditData = redditResponse.data.data.children
            .filter(post => containsKeywords([post.data.title, post.data.selftext || ""], [primaryKeyword]) || containsKeywords([post.data.title, post.data.selftext || ""], secondaryKeywords))  // Include both primary and secondary search
            .map(post => ({
                title: post.data.title,
                link: `https://www.reddit.com${post.data.permalink}`,
                score: post.data.score,
                comments: post.data.num_comments,
                creation_date: new Date(post.data.created_utc * 1000)  
            }));

        
        const combinedResults = [...stackOverflowData, ...redditData];

        
        const sortedResults = combinedResults.sort((a, b) => {
            const aPrimaryMatch = containsKeywords([a.title, a.body || ""], [primaryKeyword]) ? 1 : 0;
            const bPrimaryMatch = containsKeywords([b.title, b.body || ""], [primaryKeyword]) ? 1 : 0;
            if (aPrimaryMatch !== bPrimaryMatch) {
                return bPrimaryMatch - aPrimaryMatch;
            }
            return (b.score + (b.answers || b.comments)) - (a.score + (a.answers || a.comments)); 
        });

       
        const searchResult = new SearchResult({ query, results: sortedResults });
        await searchResult.save();

        return res.json(sortedResults);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


app.post('/send-email', async (req, res) => {
    const { email, results } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '21dce061@charusat.edu.in',  
            pass: 'lmnp xdyv kbds lkkd'      
        }
    });

    let mailOptions = {
        from: '21dce061@charusat.edu.in',
        to: email,
        subject: 'Search Results from Knowledge Base App',
        text: `Here are the results:\n${results.map(r => `${r.title}: ${r.link}`).join('\n')}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to send email' });
        }
        res.json({ success: 'Email sent successfully' });
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

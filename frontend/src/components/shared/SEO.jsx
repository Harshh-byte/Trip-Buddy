import { Helmet } from "react-helmet-async";

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.keywords]
 * @param {string} [props.image]
 * @param {string} [props.url]
 */
const SEO = ({
  title = "Trip Buddy | AI-Powered Travel Agent",
  description = "Design your dream getaway in seconds with our advanced AI travel planner.",
  keywords = "AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning",
  image = "https://trip-buddy-n6b3.onrender.com/favicon.png",
  url = "https://trip-buddy-n6b3.onrender.com/",
} = {}) => {
  const siteName = "Trip Buddy";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;

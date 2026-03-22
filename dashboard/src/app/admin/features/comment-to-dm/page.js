"use client";
import FeaturePageTemplate from "../../components/FeaturePageTemplate";
import { FEATURE_CONFIGS } from "../featureConfigs";
const SLUG = "comment-to-dm";
const config = FEATURE_CONFIGS[SLUG];
export default function Page() {
  if (!config) return <p>Feature not found</p>;
  return <FeaturePageTemplate feature={SLUG} {...config} />;
}

import { google } from "googleapis";

import type {
  SearchConsoleCredentials,
  SearchConsoleMetricRecord,
  SearchConsoleProperty,
  SearchConsoleService
} from "./types";

function createOauthClient(credentials: SearchConsoleCredentials) {
  const client = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);
  client.setCredentials({
    refresh_token: credentials.refreshToken
  });
  return client;
}

export class GoogleSearchConsoleService implements SearchConsoleService {
  async listProperties(credentials: SearchConsoleCredentials): Promise<SearchConsoleProperty[]> {
    const auth = createOauthClient(credentials);
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const response = await searchconsole.sites.list();

    return (response.data.siteEntry ?? []).map((entry) => ({
      siteUrl: entry.siteUrl ?? "",
      permissionLevel: entry.permissionLevel ?? "siteUnverifiedUser"
    }));
  }

  async syncMetrics(input: {
    credentials: SearchConsoleCredentials;
    propertyUrl: string;
    startDate: string;
    endDate: string;
  }): Promise<SearchConsoleMetricRecord[]> {
    const auth = createOauthClient(input.credentials);
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const response = await searchconsole.searchanalytics.query({
      siteUrl: input.propertyUrl,
      requestBody: {
        startDate: input.startDate,
        endDate: input.endDate,
        dimensions: ["page", "date"],
        rowLimit: 25000
      }
    });

    return (response.data.rows ?? []).map((row) => ({
      pageUrl: row.keys?.[0] ?? "",
      date: row.keys?.[1] ?? input.endDate,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0
    }));
  }
}

export class MockSearchConsoleService implements SearchConsoleService {
  async listProperties(_credentials: SearchConsoleCredentials): Promise<SearchConsoleProperty[]> {
    void _credentials;

    return [
      {
        siteUrl: "sc-domain:rankforge.dev",
        permissionLevel: "siteOwner"
      }
    ];
  }

  async syncMetrics(input: {
    credentials: SearchConsoleCredentials;
    propertyUrl: string;
    startDate: string;
    endDate: string;
  }): Promise<SearchConsoleMetricRecord[]> {
    const endDate = new Date(input.endDate);

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(endDate);
      day.setDate(endDate.getDate() - index);

      return {
        pageUrl: input.propertyUrl.includes("sc-domain:")
          ? "https://rankforge.dev/"
          : input.propertyUrl,
        date: day.toISOString().slice(0, 10),
        clicks: 20 + index * 3,
        impressions: 450 + index * 25,
        ctr: 0.043,
        position: 11.2 - index * 0.2
      };
    });
  }
}

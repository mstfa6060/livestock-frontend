"use client";

import * as signalR from "@microsoft/signalr";

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  content: string;
  attachmentUrls: string | null;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  createdAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private static instance: ChatService;
  private connectionPromise: Promise<void> | null = null;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async connect(): Promise<void> {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (!token) {
      throw new Error("JWT token bulunamadi");
    }

    // Hub URL - API Gateway uzerinden
    const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
    const baseUrl = isDevelopment
      ? "https://dev-api.livestock-trading.com"
      : "https://api.livestock-trading.com";
    const hubUrl = `${baseUrl}/livestocktrading/hubs/chat`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Connection state handlers
    this.connection.onreconnecting((error) => {
      console.log("SignalR yeniden baglaniyor...", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR yeniden baglandi:", connectionId);
    });

    this.connection.onclose((error) => {
      console.log("SignalR baglantisi kapandi:", error);
      this.connectionPromise = null;
    });

    this.connectionPromise = this.connection.start().then(() => {
      console.log("SignalR baglantisi kuruldu");
    });

    return this.connectionPromise;
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
    }
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  public async joinConversation(conversationId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("JoinConversation", conversationId);
    }
  }

  public async leaveConversation(conversationId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("LeaveConversation", conversationId);
    }
  }

  public async markMessageAsRead(messageId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("MarkMessageAsRead", messageId);
    }
  }

  public async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("SendTypingIndicator", conversationId, isTyping);
    }
  }

  public onReceiveMessage(callback: (message: Message) => void): void {
    this.connection?.on("ReceiveMessage", callback);
  }

  public offReceiveMessage(callback: (message: Message) => void): void {
    this.connection?.off("ReceiveMessage", callback);
  }

  public onTypingIndicator(callback: (indicator: TypingIndicator) => void): void {
    this.connection?.on("TypingIndicator", callback);
  }

  public offTypingIndicator(callback: (indicator: TypingIndicator) => void): void {
    this.connection?.off("TypingIndicator", callback);
  }

  public onMessageRead(callback: (data: { messageId: string; readAt: string }) => void): void {
    this.connection?.on("MessageRead", callback);
  }

  public offMessageRead(callback: (data: { messageId: string; readAt: string }) => void): void {
    this.connection?.off("MessageRead", callback);
  }
}

export const chatService = ChatService.getInstance();

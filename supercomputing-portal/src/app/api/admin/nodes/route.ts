import { NextResponse } from "next/server";

import { listNodesWithTelemetry, registerNode } from "@/lib/admin-node-store";
import { createNodeTelemetry } from "@/lib/admin-node-telemetry";

export async function GET() {
  const nodes = await listNodesWithTelemetry();
  return NextResponse.json({ nodes });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { error: "요청 본문이 비어 있거나 형식이 잘못되었습니다." },
      { status: 400 },
    );
  }

  const { name, ipAddress, role, labels } = payload as {
    name?: string;
    ipAddress?: string;
    role?: string;
    labels?: string[] | string;
  };

  try {
    const node = await registerNode({
      name: name ?? "",
      ipAddress: ipAddress ?? "",
      role: role ?? "",
      labels,
    });

    const telemetry = createNodeTelemetry(node);

    return NextResponse.json(
      {
        node: {
          ...node,
          telemetry,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노드를 등록하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

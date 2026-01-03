import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import Application from "@/models/Application";

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await dbConnect();

    // 4. Fetch data using the unwrapped id
    const project = await Project.findById(id);
    
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const applications = await Application.find({ projectId: id });

    return NextResponse.json({ project, applications });
  } catch (error: any) {
    console.error("GET Project Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch the existing project
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden: You don't own this project" }, { status: 403 });
    }

    // Get update data from request
    const updateData = await req.json();
    const { title, description, status, githubLink, demoLink, roles } = updateData;

    // Validate roles
    if (roles && roles.length > 0) {
      for (const role of roles) {
        if (role.needed < role.filled) {
          return NextResponse.json({ 
            message: `Role "${role.roleName}" cannot have needed slots less than filled slots` 
          }, { status: 400 });
        }
      }
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        status,
        githubLink,
        demoLink,
        roles,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      message: "Project updated successfully", 
      project: updatedProject 
    }, { status: 200 });

  } catch (error: any) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch the project
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden: You don't own this project" }, { status: 403 });
    }

    // Check if project has accepted members
    const acceptedApplications = await Application.find({ 
      projectId: id, 
      status: "ACCEPTED" 
    });

    if (acceptedApplications.length > 0) {
      return NextResponse.json({ 
        message: "Cannot delete project with accepted members. Please remove members first or mark project as completed." 
      }, { status: 400 });
    }

    // Delete all applications for this project
    await Application.deleteMany({ projectId: id });

    // Delete the project
    await Project.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: "Project deleted successfully" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
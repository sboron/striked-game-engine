
import { Mesh3D } from "./Mesh3D";
import { Vector2D, Vector3D } from '@engine/types';
import { RenderableRenderer } from "@engine/modules";

export class PlaneMesh extends Mesh3D {

    constructor() {
        super();

        this.generateUv0();
        this.generateIndicies();
        this.generateVertices();
        this.generateColors();
        this.generateNormals();
    }

    onRender(renderer: RenderableRenderer)
    {
        
    }

    private generateColors() {
        this._data.colors = [new Vector3D(1, 1, 1)];
    }

    private generateNormals() {
        this._data.normals = [
            // Front
            new Vector3D(0, 1, -0),
            // Back
            new Vector3D(0, 1, -0),
            // Top
            new Vector3D(0, 1, -0),
            // Bottom
            new Vector3D(0, 1, -0)
        ];
    }

    private generateVertices() {
        // Front face
        this._data.vertices = [
            new Vector3D(-3, 0, 3),
            // Back face
            new Vector3D(3, 0, -3),
            // Top face
            new Vector3D(-3, 0, -3),
            // Bottom face
            new Vector3D(3, 0, 3)];
    }

    private generateIndicies() {
        this._data.indicies = [0, 1, 2, 0, 3, 1];
    }
    private generateUv0() {
        // Front
        this._data.uvs[0] = [
            new Vector2D(0, 1),
            // Back
            new Vector2D(1, 0),
            // Top
            new Vector2D(0, 0),
            // Bottom
            new Vector2D(1, 1)
        ];
    }
}
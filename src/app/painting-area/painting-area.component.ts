import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { NgIf, NgStyle } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import {
  switchMap,
  takeUntil,
  pairwise,
  filter,
  finalize,
  last,
} from 'rxjs/operators';
import { ImageServiceService } from '../../services/images/image-service.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-painting-area',
  imports: [NgIf, DragDropModule, CdkDrag, NgStyle],
  templateUrl: './painting-area.component.html',
  styleUrl: './painting-area.component.css',
})
export class PaintingAreaComponent {
  width = 400;
  height = 400;
  isDown: boolean = false;
  isSelected = false;
  steps: any = [];
  undo: any = [];

  previewImage: string | ArrayBuffer | null | undefined = '';

  @ViewChild('canvas') public canvas!: ElementRef;
  @ViewChild('image', { static: false })
  imageRef!: ElementRef<HTMLImageElement>;

  constructor(private imageService: ImageServiceService) {}

  public ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

    const cx = canvasEl.getContext('2d');
    console.log('context', cx);

    // set the width and height

    const parentEl = canvasEl.parentElement;
    console.log(parentEl);

    const width = parentEl?.clientWidth || window.innerWidth;
    const height = parentEl?.clientHeight || window.innerHeight;

    canvasEl.width = width;
    canvasEl.height = height;
    // set some default properties about the line
    if (cx) {
      cx.lineWidth = 3;
      cx.lineCap = 'round';
      cx.strokeStyle = '#000';
    }

    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
  }

  ngOnInit() {
    this.imageService.previewImage$.subscribe((img) => {
      console.log(img);
      this.previewImage = img;
    });
  }

  captureEvents(canvasEl: HTMLCanvasElement) {
    let isDrawing = false;

    fromEvent<MouseEvent>(canvasEl, 'mousedown').subscribe(() => {
      isDrawing = true;
    });

    fromEvent<MouseEvent>(document, 'mouseup').subscribe(() => {
      isDrawing = false;
    });

    fromEvent<MouseEvent>(canvasEl, 'mousedown')
      .pipe(
        filter(() => isDrawing),
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent<MouseEvent>(canvasEl, 'mousemove').pipe(
            // we'll stop (and unsubscribe) once the user releases the mouse
            // this will trigger a 'mouseup' event
            takeUntil(fromEvent<MouseEvent>(canvasEl, 'mouseup')),
            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)

            // pairwise lets us get the previous value to draw a line from
            // the previous point to the current point
            finalize(() => {
              this.undo.push(this.steps);
              console.log('Test undo', this.undo);
              this.steps = [];
            }),
            pairwise()
          );
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();

        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top,
        };

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top,
        };

        this.steps.push([prevPos, currentPos]);

        this.drawOnCanvas(prevPos, currentPos);
      });
  }

  teste() {
    const prevPos = {
      x: 150,
      y: 300,
    };
    const currentPos = {
      x: 400,
      y: 500,
    };

    console.log('test button');

    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const cx = canvasEl.getContext('2d');

    // incase the context is not set
    if (!cx) {
      return;
    }

    // start our drawing path
    cx.beginPath();

    // we're drawing lines so we need a previous position
    if (prevPos) {
      // sets the start point
      cx.moveTo(prevPos.x, prevPos.y); // from

      // draws a line from the start pos until the current position
      cx.lineTo(currentPos.x, currentPos.y);

      // strokes the current path with the styles we set earlier
      cx.stroke();

      cx.closePath();
    }
  }

  erase() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const cx = canvasEl.getContext('2d');

    if (!cx) {
      return;
    }

    const previousStrokeStyle = cx.strokeStyle;
    const previousLineWidth = cx.lineWidth;

    cx.strokeStyle = '#ffffff'; // ou 'rgba(0,0,0,0)' para fundo transparente
    cx.lineWidth = 5;

    console.log('TESTEEEE', this.undo[this.undo.length - 1]);

    const lastStroke = this.undo[this.undo.length - 1];

    lastStroke.map((stroke: any) => {
      cx.beginPath();
      cx.moveTo(stroke[0].x, stroke[0].y);
      cx.lineTo(stroke[1].x, stroke[1].y);
      cx.stroke();
      cx.closePath();
    });

    cx.strokeStyle = previousStrokeStyle;
    cx.lineWidth = previousLineWidth;
  }

  drawOnCanvas(
    prevPos: { x: number; y: number },
    currentPos: { x: number; y: number }
  ) {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

    const cx = canvasEl.getContext('2d');

    // incase the context is not set
    if (!cx) {
      return;
    }

    // start our drawing path
    cx.beginPath();

    // we're drawing lines so we need a previous position
    if (prevPos) {
      // sets the start point
      cx.moveTo(prevPos.x, prevPos.y); // from

      // draws a line from the start pos until the current position
      cx.lineTo(currentPos.x, currentPos.y);

      // strokes the current path with the styles we set earlier
      cx.stroke();

      cx.closePath();
    }
  }
}

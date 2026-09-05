float flowNoise(vec2 p) { return sin(p.y * 26.0 + sin(p.y * 11.0 + p.x * 3.0)) * 0.5 + 0.5; }
